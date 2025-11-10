import { useState, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";

// Modals
import AddChecklistAmenityModal from "../../components/Admin/Modals/ChecklistAmenity/AddChecklistAmenityModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import EditChecklistAmenityModal from "../../components/Admin/Modals/ChecklistAmenity/EditChecklistAmenityModal";

// Lazy-loaded View Component
import ChecklistAmenityList from "../../components/Admin/Modals/ChecklistAmenity/ChecklistAmenities";

const ChecklistAmenities = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState(null);

  const {
    data: amenities,
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
    tableName: "checklist_amenities",
    selectQuery: "id, amenity_name, status, created_at, items (id, item_name)",
    searchColumn: "amenity_name",
    initialPageSize: 10,
  });

  // Modal handlers
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    mutate();
  };

  const openEditModal = (amenity) => {
    setSelectedAmenity(amenity);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (amenity) => {
    setSelectedAmenity(amenity);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAmenity) return;
    setIsProcessing(true);

    const updatedData = amenities.filter((am) => am.id !== selectedAmenity.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("checklist_amenities")
        .delete()
        .eq("id", selectedAmenity.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete amenity:", err);
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedAmenity(null);
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

    if (!amenities || amenities.length === 0) {
      return (
        <EmptyState
          title="No Amenities Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Amenity" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <ChecklistAmenityList
          amenities={amenities}
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
          title="Manage Checklist Amenities"
          description="Link amenities to specific inventory items for checklist tracking."
          buttonText="Add New Amenity"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by amenity name..."
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

      <AddChecklistAmenityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedAmenity && (
        <>
          <EditChecklistAmenityModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            amenity={selectedAmenity}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedAmenity.amenity_name}
          />
        </>
      )}
    </>
  );
};

export default ChecklistAmenities;
