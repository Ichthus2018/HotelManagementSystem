// src/pages/Admin/Tabs/RoomAmenitiesTab.jsx

import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";
import { FiPlus, FiTrash } from "react-icons/fi";

// UI Components
import Loader from "../../components/ui/common/Loader";
import EmptyState from "../../components/ui/common/EmptyState";

// Modals
import AddAmenityFromListModal from "../../components/Admin/Modals/Amenities/AddAmenityFromListModal";

const RoomAmenitiesTab = () => {
  const [roomsWithAmenities, setRoomsWithAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch and process data from all three tables
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all necessary data in parallel
      const [roomsRes, itemsRes, linksRes] = await Promise.all([
        supabase.from("room_areas").select("*").order("name"),
        supabase.from("items").select("id, item_name"), // Only need id and name
        supabase.from("checklist_amenities").select("room_area_id, item_id"),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (linksRes.error) throw linksRes.error;

      const rooms = roomsRes.data;
      const allItems = itemsRes.data;
      const links = linksRes.data;

      // Create a quick lookup map for items
      const itemsMap = new Map(allItems.map((item) => [item.id, item]));

      // 2. Combine the data
      const processedData = rooms.map((room) => {
        // Find all links for the current room
        const amenityLinks = links.filter(
          (link) => link.room_area_id === room.id
        );

        // Use the links to find the full item details from the map
        const amenities = amenityLinks
          .map((link) => itemsMap.get(link.item_id))
          .filter(Boolean); // filter(Boolean) removes any undefined if an item was deleted

        return {
          ...room,
          amenities, // This is the array of full item objects
        };
      });

      setRoomsWithAmenities(processedData);
    } catch (err) {
      console.error("Error fetching amenities data:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const openAddModal = (room) => {
    setSelectedRoom(room);
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchData(); // Refresh all data
  };

  const handleDeleteAmenityLink = async (roomId, itemId) => {
    if (!window.confirm("Remove this amenity from the room?")) return;

    // We delete the *link* in the junction table, not the item itself
    const { error: deleteError } = await supabase
      .from("checklist_amenities")
      .delete()
      .match({ room_area_id: roomId, item_id: itemId });

    if (deleteError) {
      console.error("Error removing amenity:", deleteError);
    } else {
      fetchData(); // Refresh on success
    }
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return <div className="p-4 text-red-500">Error: {error.message}</div>;
    if (!roomsWithAmenities || roomsWithAmenities.length === 0) {
      return (
        <EmptyState
          title="No Room Areas Found"
          description="Please add a room area first before assigning amenities."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomsWithAmenities.map((room) => (
          <div
            key={room.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {room.name}
            </h2>

            <div className="flex-grow">
              <ul className="space-y-2">
                {room.amenities.map((amenity) => (
                  <li
                    key={amenity.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 group"
                  >
                    <span className="text-gray-700">{amenity.item_name}</span>
                    <button
                      onClick={() =>
                        handleDeleteAmenityLink(room.id, amenity.id)
                      }
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete amenity"
                    >
                      <FiTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {room.amenities.length === 0 && (
                <p className="text-sm text-gray-400 p-2">
                  No amenities assigned.
                </p>
              )}
            </div>

            <button
              onClick={() => openAddModal(room)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 p-2 rounded-lg font-semibold"
            >
              <FiPlus /> Add Amenity
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 md:p-6">{renderContent()}</div>

      {selectedRoom && (
        <AddAmenityFromListModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          room={selectedRoom}
        />
      )}
    </>
  );
};

export default RoomAmenitiesTab;
