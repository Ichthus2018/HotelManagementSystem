// src/pages/CleaningChecklistPage.js

import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";
import { FiPlus, FiTrash, FiEdit } from "react-icons/fi"; // Example icons

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import Loader from "../../components/ui/common/Loader";
import EmptyState from "../../components/ui/common/EmptyState";
import AddRoomAreaModal from "../../components/Admin/Modals/CleaningChecklist/AddRoomAreaModal";
import AddChecklistItemModal from "../../components/Admin/Modals/CleaningChecklist/AddChecklistItemModal";
import EditRoomAreaModal from "../../components/Admin/Modals/CleaningChecklist/EditRoomAreaModal";

const CleaningChecklistPage = () => {
  const [roomAreas, setRoomAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // --- NEW: State for the Edit Room Modal ---
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState(null);

  // Fetch and process data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch rooms and items in parallel
      const [roomsRes, itemsRes] = await Promise.all([
        supabase.from("room_areas").select("*").order("created_at"),
        supabase.from("checklist_items").select("*").order("created_at"),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Group items by room
      const roomsWithItems = roomsRes.data.map((room) => ({
        ...room,
        items: itemsRes.data.filter((item) => item.room_area_id === room.id),
      }));

      setRoomAreas(roomsWithItems);
    } catch (err) {
      console.error("Error fetching checklist data:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditRoomModal = (room) => {
    setSelectedRoomForEdit(room);
    setIsEditRoomModalOpen(true);
  };

  const handleEditRoomSuccess = () => {
    setIsEditRoomModalOpen(false);
    fetchData(); // Refresh data to show the updated name
  };

  const handleDeleteRoom = async (roomId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this room and all its items?"
      )
    ) {
      const { error } = await supabase
        .from("room_areas")
        .delete()
        .eq("id", roomId);
      if (error) {
        console.error("Error deleting room:", error);
      } else {
        fetchData(); // Refresh data on success
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", itemId);
      if (error) {
        console.error("Error deleting item:", error);
      } else {
        fetchData(); // Refresh data on success
      }
    }
  };

  const openAddItemModal = (roomId) => {
    setSelectedRoomId(roomId);
    setIsAddItemModalOpen(true);
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return <div className="p-4 text-red-500">Error: {error.message}</div>;
    if (roomAreas.length === 0) {
      return (
        <EmptyState
          title="No Rooms Found"
          description='Click "Add New Room Area" to get started.'
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomAreas.map((room) => (
          <div key={room.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditRoomModal(room)}
                  className="text-gray-500 hover:text-blue-500"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <FiTrash />
                </button>
              </div>
            </div>

            <ul className="space-y-3">
              {room.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <span
                    className={`text-gray-700 ${
                      item.is_checked ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents toggling check when deleting
                      handleDeleteItem(item.id);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-4"
                  >
                    <FiTrash size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openAddItemModal(room.id)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
            >
              <FiPlus /> Add Item
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 md:p-6 max-w-7xl">
        <PageHeader
          title="Housekeeping Cleaning Card"
          description="Manage cleaning tasks for all room areas."
          buttonText="Add New Room Area"
          onButtonClick={() => setIsAddRoomModalOpen(true)}
        />
        <div className="overflow-hidden">{renderContent()}</div>
      </div>

      <AddRoomAreaModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onSuccess={fetchData}
      />

      {selectedRoomId && (
        <AddChecklistItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onSuccess={fetchData}
          roomAreaId={selectedRoomId}
        />
      )}

      {selectedRoomForEdit && (
        <EditRoomAreaModal
          isOpen={isEditRoomModalOpen}
          onClose={() => setIsEditRoomModalOpen(false)}
          onSuccess={handleEditRoomSuccess}
          roomArea={selectedRoomForEdit}
        />
      )}
    </>
  );
};

export default CleaningChecklistPage;
