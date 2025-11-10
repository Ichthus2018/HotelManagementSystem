import { useState, Suspense, lazy } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// Lightweight components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";

// Modals
import AddRoomTypeModal from "../../components/Admin/Modals/RoomType/AddRoomTypeModal";
import EditRoomTypeModal from "../../components/Admin/Modals/RoomType/EditRoomTypeModal";
import RoomTypeDetails from "../../components/Admin/Modals/RoomType/Pages/RoomTypeDetails";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// UI Components
import Loader from "../../components/ui/common/Loader";
import ManageRoomTypeChecklistModal from "../../components/Admin/Modals/RoomType/ManageRoomTypeChecklistModal";
import ManageRoomTypeAmenitiesModal from "../../components/Admin/Modals/RoomType/ManageRoomTypeAmenitiesModal";
import ManageRoomTypeItemsModal from "../../components/Admin/Modals/RoomType/ManageRoomTypeItemsModal";
// Lazy-loaded Grid component
const RoomTypeCardGrid = lazy(() =>
  import("../../components/Admin/Modals/RoomType/Pages/RoomTypeCardGrid")
);

const RoomTypes = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);

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
    selectQuery: `
    *,
    rooms:rooms(count)
  `,
    searchColumn: "title",
    initialPageSize: 9,
  });
  // --- Modal handler functions ---
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };

  const openChecklistModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsChecklistModalOpen(true);
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

  // --- View Details Modal handler functions ---
  const handleViewDetails = (roomType) => {
    setSelectedRoomType(roomType);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    // Delay clearing to allow for exit animation
    setTimeout(() => {
      setSelectedRoomType(null);
    }, 300);
  };

  const openAmenitiesModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsAmenitiesModalOpen(true);
  };

  // --- ADDED: Success handler for the Amenities Modal ---
  const handleAmenitiesSaveSuccess = () => {
    setIsAmenitiesModalOpen(false); // Close the modal
    mutate(); // Re-fetch the data to reflect the changes
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoomType) return;
    setIsProcessing(true);

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
      mutate(); // Revert optimistic update
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      // If the details modal was open when delete was confirmed, close it.
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
      setSelectedRoomType(null);
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
          onManageChecklist={openChecklistModal}
          onManageAmenities={openAmenitiesModal}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
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
                  activeLinkClassName="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                  previousLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  nextLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AddRoomTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <RoomTypeDetails
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        roomType={selectedRoomType}
        onEdit={(roomType) => {
          setIsDetailsModalOpen(false);
          openEditModal(roomType);
        }}
        onDelete={(roomType) => {
          setIsDetailsModalOpen(false);
          openDeleteModal(roomType);
        }}
      />

      {selectedRoomType && (
        <>
          <EditRoomTypeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            roomType={selectedRoomType}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedRoomType.title}
          />
          <ManageRoomTypeChecklistModal
            isOpen={isChecklistModalOpen}
            onClose={() => setIsChecklistModalOpen(false)}
            roomType={selectedRoomType}
          />
          {/* --- CHANGED: Added the onSuccess prop --- */}
          {/* <ManageRoomTypeAmenitiesModal
            isOpen={isAmenitiesModalOpen}
            onClose={() => setIsAmenitiesModalOpen(false)}
            onSuccess={handleAmenitiesSaveSuccess}
            roomType={selectedRoomType}
          /> */}

          <ManageRoomTypeItemsModal
            isOpen={isAmenitiesModalOpen}
            onClose={() => setIsAmenitiesModalOpen(false)}
            onSuccess={handleAmenitiesSaveSuccess}
            roomType={selectedRoomType}
          />
        </>
      )}
    </>
  );
};

export default RoomTypes;
