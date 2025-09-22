// File: src/pages/Admin/RoomNumbers.jsx

import { useState, lazy, Suspense, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { hookRoomType } from "../../hooks/Admin/hookRoomType";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";

// Modals
import AddRoomModal from "../../components/Admin/Modals/RoomNumbers/AddRoomModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import { useParams } from "react-router-dom";
import EditRoomModal from "../../components/Admin/Modals/RoomNumbers/EditRoomModal";

// Lazy-loaded View Component
const RoomList = lazy(() =>
  import("../../components/Admin/Modals/RoomNumbers/Pages/RoomList")
);

const RoomNumbers = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const { roomTypeId } = useParams(); // Get the ID from the URL, e.g., "123"
  const [roomTypeName, setRoomTypeName] = useState("");

  useEffect(() => {
    if (roomTypeId) {
      const fetchRoomTypeName = async () => {
        const { data } = await supabase
          .from("room_types")
          .select("title")
          .eq("id", roomTypeId)
          .single();
        if (data) {
          setRoomTypeName(data.title);
        }
      };
      fetchRoomTypeName();
    } else {
      setRoomTypeName(""); // Reset if we navigate back to the "all rooms" page
    }
  }, [roomTypeId]);

  const {
    data: rooms,
    totalCount,
    isLoading,
    error,
    mutate,
    currentPage,
    setCurrentPage,
    pageCount,
    pageSize,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearch,
    clearSearch,
  } = hookRoomType({
    tableName: "rooms",
    selectQuery:
      "id, room_number, status, room_types(id, title), locations(id, name)",
    searchColumn: "room_number",
    initialPageSize: 10,
    filter: roomTypeId ? { column: "room_type_id", value: roomTypeId } : null,
  });

  // Modal handlers
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate(); // Re-fetch data
  };

  const openDeleteModal = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (room) => {
    setSelectedItem(room);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    mutate(); // Re-fetch data to show changes
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoom) return;
    setIsProcessing(true);

    // Optimistic UI update
    const updatedData = rooms.filter((r) => r.id !== selectedRoom.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", selectedRoom.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete room:", err);
      // Revert on failure
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedRoom(null);
    }
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Error: {error.message}
        </div>
      );

    if (!rooms || rooms.length === 0) {
      return (
        <EmptyState
          title="No Rooms Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Room" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <RoomList
          rooms={rooms}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title={
            roomTypeId
              ? `Rooms for "${roomTypeName || "..."}"`
              : "Manage All Rooms"
          }
          description="View, add, or remove rooms and manage their status."
          buttonText="Add New Room"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by room number..."
        />

        <div className="overflow-hidden">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
            {renderContent()}
            {totalCount > pageSize && (
              <div className="p-6 border-t border-gray-200">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel="›"
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  pageCount={pageCount}
                  previousLabel="‹"
                  renderOnZeroPageCount={null}
                  forcePage={currentPage - 1}
                  containerClassName="flex items-center justify-center gap-2 text-base font-medium"
                  pageLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  activeLinkClassName="bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                  previousLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  nextLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        preselectedRoomTypeId={roomTypeId}
      />

      {selectedItem && (
        <>
          <EditRoomModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            room={selectedItem}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedItem.room_number}
          />
        </>
      )}
    </>
  );
};

export default RoomNumbers;
