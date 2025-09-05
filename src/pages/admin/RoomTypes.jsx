// src/pages/RoomTypes.jsx

import { useState, Suspense, lazy } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// Lightweight components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";

// Modals (consider lazy loading these as well if they are large)
import AddRoomTypeModal from "../../components/Admin/Modals/RoomType/AddRoomTypeModal";
import EditRoomTypeModal from "../../components/Admin/Modals/RoomType/EditRoomTypeModal";
import DeleteRoomTypeConfirmationModal from "../../components/Admin/Modals/RoomType/DeleteRoomTypeConfirmationModal";
import Loader from "../../components/ui/common/loader";

// Lazy-loaded View components
const RoomTypeCardGrid = lazy(() =>
  import("../../components/Admin/Modals/RoomType/Pages/RoomTypeCardGrid")
);
const RoomTypeDetails = lazy(() =>
  import("../../components/Admin/Modals/RoomType/Pages/RoomTypeDetails")
);

const RoomTypes = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);

  const {
    data: roomTypes,
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
  } = useSupabaseQuery({
    tableName: "room_types",
    selectQuery: "*", // Fetch all data for the details view
    searchColumn: "title",
    initialPageSize: 9, // A 3x3 grid looks good
  });

  // Modal handler functions
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };
  const openEditModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedRoomType(null);
    mutate();
  };
  const openDeleteModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsDeleteModalOpen(true);
  };

  // View handler functions
  const handleViewDetails = (roomType) => {
    setSelectedRoomType(roomType);
    setViewingDetails(true);
  };
  const handleBackToGrid = () => {
    setSelectedRoomType(null);
    setViewingDetails(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoomType) return;
    setIsProcessing(true);

    // Optimistic UI update
    const updatedData = roomTypes.filter((rt) => rt.id !== selectedRoomType.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      if (selectedRoomType.images && selectedRoomType.images.length > 0) {
        const filePaths = selectedRoomType.images.map(
          (url) => url.split("/room_type_images/")[1]
        );
        await supabase.storage.from("room_type_images").remove(filePaths);
      }
      const { error: deleteError } = await supabase
        .from("room_types")
        .delete()
        .eq("id", selectedRoomType.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete room type:", err);
      mutate(); // Revert optimistic update on failure
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedRoomType(null);
      // If we were on the details page, go back to the grid
      if (viewingDetails) {
        setViewingDetails(false);
      }
    }
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500">Error: {error.message}</div>
      );

    if (viewingDetails && selectedRoomType) {
      return (
        <Suspense fallback={<Loader />}>
          <RoomTypeDetails
            roomType={selectedRoomType}
            onBack={handleBackToGrid}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </Suspense>
      );
    }

    if (!roomTypes || roomTypes.length === 0) {
      return (
        <EmptyState
          title="No Room Types Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Room Type" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <RoomTypeCardGrid
          roomTypes={roomTypes}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onViewDetails={handleViewDetails}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        {!viewingDetails && (
          <>
            <PageHeader
              title="Manage Room Types"
              description="Configure your property room types here."
              buttonText="Add New Room Type"
              onButtonClick={() => setIsAddModalOpen(true)}
            />
            <SearchInput
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeSearchTerm={activeSearchTerm}
              onSearch={handleSearch}
              onClear={clearSearch}
              placeholder="Search by room title..."
            />
          </>
        )}

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

      <AddRoomTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {selectedRoomType && (
        <>
          <EditRoomTypeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            roomType={selectedRoomType}
          />
          <DeleteRoomTypeConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedRoomType.title}
          />
        </>
      )}
    </>
  );
};

export default RoomTypes;
