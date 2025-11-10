import React, { useState, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";

// Modals
import AddReceiveItemsModal from "../../components/Admin/Modals/ReceiveItems/AddReceiveItemsModal";
import EditReceiveItemsModal from "../../components/Admin/Modals/ReceiveItems/EditReceiveItemsModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const ReceiveItemsList = lazy(() =>
  import("../../components/Admin/Modals/ReceiveItems/Pages/ReceiveItemsList")
);

const ReceivedItems = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const {
    data: batches,
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
    tableName: "inventory_batches",
    selectQuery: `id, quantity, batch_number, expiry_date, received_at, items (id, item_name, item_code, batch)`,
    searchColumn: "items(item_name)", // NOTE: Searching on joined tables can be tricky. A database view or function might be more performant.
    order: "received_at",
    ascending: false,
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

  const openEditModal = (batch) => {
    setSelectedBatch(batch);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (batch) => {
    setSelectedBatch(batch);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBatch) return;
    setIsProcessing(true);

    try {
      const { error: deleteError } = await supabase
        .from("inventory_batches")
        .delete()
        .eq("id", selectedBatch.id);
      if (deleteError) throw deleteError;
      mutate();
    } catch (err) {
      console.error("Failed to delete batch:", err);
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
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

    if (!batches || batches.length === 0) {
      return (
        <EmptyState
          title="No Stock Received Yet"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Receive New Stock" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <ReceiveItemsList
          batches={batches}
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
          title="Receive Stock"
          description="Log new inventory receipts and manage existing batches."
          buttonText="Receive New Stock"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by item name..."
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
                  activeLinkClassName="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  previousLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  nextLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <AddReceiveItemsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedBatch && (
        <>
          <EditReceiveItemsModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            batch={selectedBatch}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={`receipt for ${selectedBatch.items.item_name} (Qty: ${selectedBatch.quantity})`}
          />
        </>
      )}
    </>
  );
};

export default ReceivedItems;
