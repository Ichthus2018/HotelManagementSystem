// src/pages/Guests.jsx

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
import AddGuestModal from "../../components/Admin/Modals/Guest/AddGuestModal";
import EditGuestModal from "../../components/Admin/Modals/Guest/EditGuestModal"; // <-- Import Edit Modal
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const GuestList = lazy(() =>
  import("../../components/Admin/Modals/Guest/Pages/GuestList")
);

const Guests = () => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // <-- State for Edit Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for selected guest data
  const [guestToEdit, setGuestToEdit] = useState(null); // <-- State for guest data to edit
  const [selectedGuest, setSelectedGuest] = useState(null);

  const {
    data: guests,
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
    tableName: "guests",
    selectQuery: "*", // <-- IMPORTANT: Fetch all columns for editing
    searchColumn: "first_name",
    initialPageSize: 10,
  });

  // Modal handlers
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate(); // Re-fetch data
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setGuestToEdit(null);
    mutate(); // Re-fetch data after edit
  };

  const openEditModal = (guest) => {
    setGuestToEdit(guest);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (guest) => {
    setSelectedGuest(guest);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGuest) return;
    setIsProcessing(true);

    const updatedData = guests.filter((g) => g.id !== selectedGuest.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("guests")
        .delete()
        .eq("id", selectedGuest.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete guest:", err);
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedGuest(null);
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
    if (!guests || guests.length === 0) {
      return (
        <EmptyState
          title="No Guests Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Guest" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        {/* IMPORTANT: Your GuestList component needs an "Edit" button that calls the onEdit prop */}
        <GuestList
          guests={guests}
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
          title="Manage Guests"
          description="View, add, edit, or remove guest information."
          buttonText="Add New Guest"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by guest's first name..."
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

      <AddGuestModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Render Edit Modal */}
      {guestToEdit && (
        <EditGuestModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          guestData={guestToEdit}
        />
      )}

      {selectedGuest && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isProcessing}
          itemName={`${selectedGuest.first_name} ${selectedGuest.last_name}`}
        />
      )}
    </>
  );
};

export default Guests;
