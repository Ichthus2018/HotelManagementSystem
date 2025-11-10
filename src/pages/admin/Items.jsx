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
import AddItemModal from "../../components/Admin/Modals/Item/AddItemModal";
import EditItemModal from "../../components/Admin/Modals/Item/EditItemModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const ItemList = lazy(() =>
  import("../../components/Admin/Modals/Item/Pages/ItemList")
);

const Items = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    data: items,
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
    tableName: "items",
    selectQuery: `
      id, item_code, item_name, batch, status, created_at, item_class,
      stock_available, stock_dirty, stock_in_laundry, stock_in_use, stock_under_maintenance,
      item_type (id, item_type_name),
      item_lifecycle_types (id, lifecycle_name),
      categories_1 (id, category_1_name),
      categories_2 (id, category_2_name),
      categories_3 (id, category_3_name),
      categories_4 (id, category_4_name),
      categories_5 (id, category_5_name),
      boms (
        id,
        bom_components (
          quantity_required,
          component_item:items (id, item_name, item_code)
        )
      )
    `,
    searchColumn: "item_name",
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

  const openEditModal = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);

    try {
      const { error: deleteError } = await supabase
        .from("items")
        .delete()
        .eq("id", selectedItem.id);
      if (deleteError) throw deleteError;
      mutate(); // Re-fetch data after successful delete
    } catch (err) {
      console.error("Failed to delete item:", err);
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
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

    if (!items || items.length === 0) {
      return (
        <EmptyState
          title="No Items Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Item" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <ItemList
          items={items}
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
          title="Manage Items"
          description="Add, edit, or remove items from your system."
          buttonText="Add New Item"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        {/* Item Type Info Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Cyclical */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm hover:shadow-md transition duration-200">
            <h3 className="font-semibold text-blue-700 flex items-center gap-2">
              🧺 Cyclical
            </h3>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              Reusable items that <b>cycle between clean, dirty, and laundry</b>{" "}
              states. (e.g., Towel)
            </p>
          </div>

          {/* Tracked Asset */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 shadow-sm hover:shadow-md transition duration-200">
            <h3 className="font-semibold text-green-700 flex items-center gap-2">
              📺 Tracked Asset
            </h3>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              Long-term items that are <b>assigned, moved, or repaired</b> but
              not consumed. (e.g., TV)
            </p>
          </div>

          {/* Consumable */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 shadow-sm hover:shadow-md transition duration-200">
            <h3 className="font-semibold text-yellow-700 flex items-center gap-2">
              🧴 Consumable
            </h3>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              Items that are <b>used up once</b> and then removed from
              inventory. (e.g., Soap)
            </p>
          </div>
        </div>

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

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedItem && (
        <>
          <EditItemModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            item={selectedItem}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedItem.item_name}
          />
        </>
      )}
    </>
  );
};

export default Items;
