import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks/useUser";
import { ArrowsUpDownIcon } from "@heroicons/react/24/solid";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";
import HousekeepingRoomCard from "../../components/Admin/Modals/Housekeeping/HousekeepingRoomCard";
import SortLocationsModal from "../../components/Admin/Modals/Housekeeping/SortLocationsModal";

// Constants
export const SWR_KEY_ROOMS_DATA = "rooms_data";
const LOCATION_ORDER_STORAGE_KEY = "user_location_sort_order";

const fetchRoomsData = async ([_key, currentUser, searchTerm]) => {
  try {
    const { data: settings } = await supabase
      .from("company_settings")
      .select("setting_value")
      .eq("setting_name", "inspection_workflow")
      .single();
    const inspectionWorkflow = settings?.setting_value !== "false";

    let staffData = { housekeepers: [], inspectors: [] };

    // Only fetch staff data for admins
    if (currentUser.admin || currentUser.sidebar_role === "Admin") {
      const { data: housekeepers } = await supabase
        .from("user_roles_view")
        .select(`id, first_name, last_name, email, workflow_role`)
        .eq("workflow_role", "Housekeeping");

      const { data: inspectors } = await supabase
        .from("user_roles_view")
        .select(`id, first_name, last_name, email, workflow_role`)
        .eq("workflow_role", "Inspector");

      staffData.housekeepers = housekeepers || [];
      staffData.inspectors = inspectors || [];
    }

    // Main query to get rooms - STRICTLY FILTERED FOR HOUSEKEEPING
    let query = supabase.from("rooms").select(
      `
        id, room_number, status,
        room_types(title, base_rate),
        locations(name),
        room_assignments!left(
          status, housekeepers, inspector, updated_at,
          users!room_assignments_inspector_fkey(first_name, last_name)
        )
      `
    );

    if (searchTerm) {
      query = query.or(
        `room_number.ilike.%${searchTerm}%,room_types.title.ilike.%${searchTerm}%`
      );
    }

    // STRICT FILTERING FOR HOUSEKEEPING - Only show rooms they need to work on
    if (!currentUser.admin && currentUser.sidebar_role !== "Admin") {
      switch (currentUser.workflow_role) {
        case "Housekeeping":
          // --- MODIFICATION START ---
          // This filter now strictly shows rooms that are:
          // 1. Assigned to the current housekeeper (their ID is in the 'housekeepers' array).
          // 2. Have a status of "For Cleaning".
          // This removes "Dirty" rooms available for self-assignment.
          query = query
            .filter(
              "room_assignments.housekeepers",
              "cs",
              `{${currentUser.id}}`
            )
            .eq("room_assignments.status", "For Cleaning");
          break;
        case "Inspector":
          // Only show rooms assigned to this inspector for inspection
          query = query.eq("room_assignments.inspector", currentUser.id);
          break;
        case "Housekeeping Manager":
          // Show all rooms with assignments
          query = query.not("room_assignments.housekeepers", "is", null);
          break;
        default:
          // For other roles, show nothing
          query = query.eq("room_assignments.status", "NonexistentStatus");
      }
    }

    // Fetch all rooms without pagination
    const { data: rooms, error: roomsError } = await query.order(
      "room_number",
      { ascending: true }
    );

    if (roomsError) throw roomsError;

    // Fetch housekeeper details for assigned rooms
    const housekeeperIds = new Set();
    rooms?.forEach((room) => {
      const assignment = room.room_assignments?.[0];
      if (assignment?.housekeepers?.length > 0) {
        assignment.housekeepers.forEach((id) => housekeeperIds.add(id));
      }
    });

    let housekeeperDetailsMap = new Map();
    if (housekeeperIds.size > 0) {
      const { data: usersData } = await supabase
        .from("user_roles_view")
        .select("id, first_name, last_name")
        .in("id", Array.from(housekeeperIds));
      if (usersData) {
        usersData.forEach((user) => housekeeperDetailsMap.set(user.id, user));
      }
    }

    const roomsWithDetails = (rooms || []).map((room) => {
      const assignment = room.room_assignments?.[0];
      if (assignment?.housekeepers?.length > 0) {
        assignment.housekeeper_details = assignment.housekeepers
          .map((id) => housekeeperDetailsMap.get(id))
          .filter(Boolean);
      } else if (assignment) {
        assignment.housekeeper_details = [];
      }
      return room;
    });

    return {
      rooms: roomsWithDetails || [],
      staffData,
      inspectionWorkflow,
    };
  } catch (error) {
    console.error("Error fetching rooms data:", error);
    throw error;
  }
};

const HouseKeeping = () => {
  // Modal states
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Data fetching and filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser, isLoading: isUserLoading } = useUser();

  // State for managing location order
  const [locationOrder, setLocationOrder] = useState([]);

  const swrKey = currentUser
    ? [SWR_KEY_ROOMS_DATA, currentUser, searchTerm]
    : null;

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetchRoomsData, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  // Database changes subscription
  useEffect(() => {
    const channel = supabase
      .channel("room_assignments_and_rooms_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_assignments" },
        () => mutate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => mutate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  const allRooms = data?.rooms || [];
  const staffData = data?.staffData;
  const inspectionWorkflow = data?.inspectionWorkflow ?? true;

  // --- Grouping and Sorting Logic ---

  const uniqueLocations = useMemo(() => {
    if (!allRooms.length) return [];
    const locationSet = new Set(
      allRooms.map((room) => room.locations?.name || "Uncategorized")
    );
    return Array.from(locationSet).sort();
  }, [allRooms]);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(LOCATION_ORDER_STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        const validOrder = parsedOrder.filter((loc) =>
          uniqueLocations.includes(loc)
        );
        const newLocations = uniqueLocations.filter(
          (loc) => !validOrder.includes(loc)
        );
        setLocationOrder([...validOrder, ...newLocations]);
      } else {
        setLocationOrder(uniqueLocations);
      }
    } catch (e) {
      console.error("Failed to parse location order from localStorage", e);
      setLocationOrder(uniqueLocations);
    }
  }, [uniqueLocations]);

  const groupedAndSortedRooms = useMemo(() => {
    if (!allRooms.length || !locationOrder.length) return [];

    const roomsByLocation = allRooms.reduce((acc, room) => {
      const locationName = room.locations?.name || "Uncategorized";
      if (!acc[locationName]) {
        acc[locationName] = [];
      }
      acc[locationName].push(room);
      return acc;
    }, {});

    return locationOrder
      .map((locationName) => ({
        location: locationName,
        rooms: roomsByLocation[locationName] || [],
      }))
      .filter((group) => group.rooms.length > 0);
  }, [allRooms, locationOrder]);

  const handleSaveLocationOrder = (newOrder) => {
    setLocationOrder(newOrder);
    localStorage.setItem(LOCATION_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // RENDER LOGIC
  const renderContent = () => {
    if (isUserLoading || isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-red-800 font-semibold">Error Loading Rooms</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button
              onClick={() => mutate()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (groupedAndSortedRooms.length === 0) {
      return (
        <EmptyState
          title="No Rooms Assigned"
          description={
            searchTerm
              ? "No assigned rooms match your current search."
              : "You have no rooms assigned for cleaning at this time."
          }
          action={
            searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search
              </button>
            )
          }
        />
      );
    }

    return (
      <div className="p-4 md:p-6 space-y-8">
        {groupedAndSortedRooms.map(({ location, rooms }) => (
          <div key={location}>
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4">
              {location}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <HousekeepingRoomCard
                  key={room.id}
                  room={room}
                  currentUser={currentUser}
                  inspectionWorkflow={inspectionWorkflow}
                  staffData={staffData}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="My Cleaning Assignments"
          description="View your assigned rooms and complete cleaning checklists."
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <SearchInput
              searchTerm={searchTerm}
              setSearchTerm={handleSearch}
              placeholder="Search by room number or type..."
              className="flex-1 min-w-[250px]"
            />
            <button
              onClick={() => setIsSortModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <ArrowsUpDownIcon className="h-5 w-5" />
              Sort Locations
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          {renderContent()}
        </div>
      </div>

      <SortLocationsModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        locations={locationOrder}
        onSaveOrder={handleSaveLocationOrder}
      />
    </>
  );
};

export default HouseKeeping;
