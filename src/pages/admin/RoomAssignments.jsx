import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks/useUser";
import { useStaffByRole } from "../../hooks/Admin/useStaffByRole";
import { ArrowsUpDownIcon } from "@heroicons/react/24/solid";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";
import RoomCard from "../../components/Admin/Modals/RoomAssignments/RoomCard";
import TagRoomRoleModal from "../../components/Admin/Modals/RoomAssignments/TagRoomRoleModal";
import SortLocationsModal from "../../components/Admin/Modals/RoomAssignments/SortLocationsModal";

// Constants
export const SWR_KEY_ROOMS_DATA = "rooms_data";
const LOCATION_ORDER_STORAGE_KEY = "user_location_sort_order";

// This is the fetcher from Component 1, which works correctly for searching.
const fetchRoomsData = async ([_key, currentUser, searchTerm]) => {
  try {
    console.log("Fetching rooms with params:", {
      currentUser: !!currentUser,
      searchTerm,
    });

    let query = supabase.from("room_search_view").select("*");

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      query = query.or(
        `room_number.ilike.${pattern},room_type_title.ilike.${pattern},location_name.ilike.${pattern}`
      );
    }

    // 3. The role-based filtering also remains the same.
    if (currentUser?.sidebar_role !== "Admin") {
      const userRoles = currentUser?.workflow_role || [];
      const isHousekeeper = userRoles.includes("Housekeeping");
      const isInspector = userRoles.includes("Inspector");

      if (isHousekeeper && isInspector) {
        // This filter needs to reference the flat columns from the view
        const filterString = `status.eq.Dirty,housekeepers.cs.{"${currentUser.id}"},inspector.eq.${currentUser.id}`;
        query = query.or(filterString);
      } else if (isHousekeeper) {
        query = query.or(
          `status.eq.Dirty,housekeepers.cs.{"${currentUser.id}"}`
        );
      } else if (isInspector) {
        query = query.eq("inspector", currentUser.id);
      }
    }

    const { data: rooms, error: roomsError } = await query.order(
      "room_number",
      { ascending: true }
    );

    if (roomsError) {
      console.error("Supabase rooms error:", roomsError);
      throw roomsError;
    }

    return {
      rooms: rooms || [], // Return the rooms directly from the view
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching rooms data:", error);
    throw error;
  }
};

const RoomAssignments = () => {
  // All state and hooks remain the same
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const {
    housekeepers,
    inspectors,
    isLoading: isStaffLoading,
  } = useStaffByRole();
  const [locationOrder, setLocationOrder] = useState([]);

  const swrKey = currentUser
    ? [SWR_KEY_ROOMS_DATA, currentUser, activeSearchTerm]
    : null;
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetchRoomsData, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  const allRooms = data?.rooms || [];

  // Subscription logic remains the same
  useEffect(() => {
    if (!currentUser) return;
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
    return () => supabase.removeChannel(channel);
  }, [mutate, currentUser]);

  const staffData = useMemo(
    () => ({ housekeepers, inspectors }),
    [housekeepers, inspectors]
  );

  // Grouping and Sorting Logic
  const uniqueLocations = useMemo(() => {
    if (!allRooms.length) return [];
    // ===== FIX #1: Access the flat `location_name` property from the view =====
    const locationSet = new Set(
      allRooms.map((room) => room.location_name || "Uncategorized")
    );
    return Array.from(locationSet).sort();
  }, [allRooms]);

  const locationOrderDependency = JSON.stringify(uniqueLocations);

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
  }, [locationOrderDependency]);

  const groupedAndSortedRooms = useMemo(() => {
    if (!allRooms.length || !locationOrder.length) return [];
    const roomsByLocation = allRooms.reduce((acc, room) => {
      // ===== FIX #2: Access the flat `location_name` property here as well =====
      const locationName = room.location_name || "Uncategorized";
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

  // All handlers and render logic below this point are identical and correct

  const handleSaveLocationOrder = (newOrder) => {
    setLocationOrder(newOrder);
    localStorage.setItem(LOCATION_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  };

  const openTagModal = (room) => {
    setSelectedRoom(room);
    setIsTagModalOpen(true);
  };

  const closeTagModal = () => {
    setIsTagModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setActiveSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchTerm("");
  };

  const renderContent = () => {
    if (isUserLoading || isLoading || isStaffLoading) {
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
          title="No Rooms Found"
          description={
            activeSearchTerm
              ? "No rooms match your current search."
              : "No rooms are available at this time."
          }
          action={
            activeSearchTerm && (
              <button
                onClick={handleClearSearch}
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
                <RoomCard
                  key={room.id}
                  room={room}
                  currentUser={currentUser}
                  onAdminAssign={openTagModal}
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
          title="c"
          description="View all rooms grouped by location and manage cleaning assignments."
        />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <SearchInput
              searchTerm={searchInput}
              setSearchTerm={setSearchInput}
              onSearch={handleSearchSubmit}
              onClear={handleClearSearch}
              activeSearchTerm={activeSearchTerm}
              placeholder="Search by room number, type, or location..."
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
      <TagRoomRoleModal
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
        roomToTag={selectedRoom}
        housekeepers={housekeepers}
        inspectors={inspectors}
        currentUser={currentUser}
      />
      <SortLocationsModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        locations={locationOrder}
        onSaveOrder={handleSaveLocationOrder}
      />
    </>
  );
};

export default RoomAssignments;
