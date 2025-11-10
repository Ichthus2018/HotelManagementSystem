// src/pages/Housekeeping.js

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks/useUser";
import { ArrowsUpDownIcon } from "@heroicons/react/24/solid";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";
import HousekeepingRoomCard from "../../components/Admin/Modals/Housekeeping/HousekeepingRoomCard";
import SortLocationsModal from "../../components/Admin/Modals/Housekeeping/SortLocationsModal";

// Constants
export const SWR_KEY_HOUSEKEEPING_ROOMS = "housekeeping_rooms_data";
const LOCATION_ORDER_STORAGE_KEY = "housekeeper_location_sort_order";

// --- UPDATED & CORRECTED DATA FETCHER ---
const fetchHousekeepingRooms = async ([_key, currentUser, searchTerm]) => {
  try {
    // Step 1: Fetch the primary room data from the view.
    let query = supabase.from("room_search_view").select("*");

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      query = query.or(
        `room_number.ilike.${pattern},room_type_title.ilike.${pattern},location_name.ilike.${pattern}`
      );
    }

    if (currentUser?.id) {
      const filterString = `status.eq.Dirty,housekeepers.cs.{"${currentUser.id}"}`;
      query = query.or(filterString);
    }

    const { data: rooms, error } = await query.order("room_number", {
      ascending: true,
    });

    if (error) {
      console.error("Supabase rooms error:", error);
      throw error;
    }

    // If there are no rooms, return early.
    if (!rooms || rooms.length === 0) {
      return { rooms: [], timestamp: new Date().toISOString() };
    }

    // --- FIX STARTS HERE: HYDRATE THE DATA WITH USER DETAILS ---

    // Step 2: Collect all unique staff IDs from the fetched rooms.
    const staffIds = new Set();
    rooms.forEach((room) => {
      if (room.housekeepers) {
        room.housekeepers.forEach((id) => staffIds.add(id));
      }
      if (room.inspector) {
        staffIds.add(room.inspector);
      }
    });

    // Step 3: Fetch details for all collected IDs in a single, efficient query.
    let userDetailsMap = new Map();
    if (staffIds.size > 0) {
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", Array.from(staffIds));

      if (userError) {
        console.error("Error fetching user details:", userError);
      } else if (users) {
        users.forEach((user) => userDetailsMap.set(user.id, user));
      }
    }

    // Step 4: Map the user details back onto each room object.
    const roomsWithDetails = rooms.map((room) => {
      // Find and attach housekeeper details
      const housekeeper_details =
        room.housekeepers
          ?.map((id) => userDetailsMap.get(id))
          .filter(Boolean) || []; // .filter(Boolean) removes undefined if a user wasn't found

      // Find and attach inspector details
      const inspector_details = room.inspector
        ? userDetailsMap.get(room.inspector)
        : null;

      return {
        ...room,
        housekeeper_details,
        inspector_details,
      };
    });

    // --- FIX ENDS HERE ---

    return {
      rooms: roomsWithDetails, // Return the enriched room data
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching housekeeping rooms data:", error);
    throw error;
  }
};

const HouseKeeping = () => {
  // --- CLEANUP: Removed admin-specific state ---
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [locationOrder, setLocationOrder] = useState([]);

  // --- CLEANUP: Removed useStaffByRole hook. It's not needed for this view. ---

  const swrKey = currentUser
    ? [SWR_KEY_HOUSEKEEPING_ROOMS, currentUser, activeSearchTerm]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetchHousekeepingRooms,
    {
      revalidateOnFocus: true,
    }
  );

  const allRooms = data?.rooms || [];

  // Subscription logic is still valuable to get real-time updates.
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel("housekeeping_room_changes")
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

  // Grouping and Sorting Logic (remains the same as it's very useful)
  const uniqueLocations = useMemo(() => {
    if (!allRooms.length) return [];
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
      const locationName = room.location_name || "Uncategorized";
      if (!acc[locationName]) acc[locationName] = [];
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setActiveSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchTerm("");
  };

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
          <h3 className="text-red-800 font-semibold">Error Loading Rooms</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      );
    }

    if (groupedAndSortedRooms.length === 0) {
      return (
        <EmptyState
          title="No Rooms to Clean"
          description={
            activeSearchTerm
              ? "No rooms match your search."
              : "All assigned rooms are clean. Great job!"
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
                <HousekeepingRoomCard
                  key={room.id}
                  room={room}
                  currentUser={currentUser}
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
          description="View rooms that are dirty or assigned to you."
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
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
