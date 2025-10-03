import { useState, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";

// Modals
import AddHotelModal from "../../components/Admin/Modals/HotelInformation/AddHotelModal";
import EditHotelModal from "../../components/Admin/Modals/HotelInformation/EditHotelModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const HotelList = lazy(() =>
  import("../../components/Admin/Modals/HotelInformation/Pages/HotelList")
);

const HotelInformation = () => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for selected hotel data
  const [hotelToEdit, setHotelToEdit] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const {
    data: hotels,
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
    tableName: "hotel_information",
    selectQuery: "*",
    searchColumn: "hotel_name",
    initialPageSize: 10,
  });

  // Modal handlers
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setHotelToEdit(null);
    mutate();
  };

  const openEditModal = (hotel) => {
    setHotelToEdit(hotel);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (hotel) => {
    setSelectedHotel(hotel);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedHotel) return;
    setIsProcessing(true);

    const updatedData = hotels.filter((h) => h.id !== selectedHotel.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("hotel_information")
        .delete()
        .eq("id", selectedHotel.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete hotel:", err);
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedHotel(null);
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
    if (!hotels || hotels.length === 0) {
      return (
        <EmptyState
          title="No Hotels Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Hotel" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <HotelList
          hotels={hotels}
          onDelete={openDeleteModal}
          onEdit={openEditModal}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="Manage Hotels"
          description="View, add, edit, or remove hotel information."
          buttonText="Add New Hotel"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by hotel name..."
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

      <AddHotelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {hotelToEdit && (
        <EditHotelModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          hotelData={hotelToEdit}
        />
      )}

      {selectedHotel && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isProcessing}
          itemName={selectedHotel.hotel_name}
        />
      )}
    </>
  );
};

export default HotelInformation;
