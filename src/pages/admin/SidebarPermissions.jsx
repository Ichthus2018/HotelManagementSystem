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
import AddPermissionModal from "../../components/Admin/Modals/SidebarPermissions/AddPermissionModal";
import EditPermissionModal from "../../components/Admin/Modals/SidebarPermissions/EditPermissionModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

// Lazy-loaded View Component
const PermissionList = lazy(() =>
  import("../../components/Admin/Modals/SidebarPermissions/PermissionList")
);

const SidebarPermissions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const {
    data: permissions,
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
    tableName: "sidebar_permissions",
    selectQuery: "*",
    searchColumn: "role_name",
    initialPageSize: 5,
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

  const openEditModal = (permission) => {
    setSelectedPermission(permission);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (permission) => {
    setSelectedPermission(permission);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPermission) return;
    setIsProcessing(true);

    const updatedData = permissions.filter(
      (perm) => perm.id !== selectedPermission.id
    );
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("sidebar_permissions")
        .delete()
        .eq("id", selectedPermission.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete permission:", err);
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedPermission(null);
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

    if (!permissions || permissions.length === 0) {
      return (
        <EmptyState
          title="No Role Permissions Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Role" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <PermissionList
          permissions={permissions}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <div className="mb-4 flex justify-start">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm shadow-sm">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span>
              This is just a sample — not yet connected to the sidebar.
            </span>
          </div>
        </div>
        <PageHeader
          title="Sidebar Permissions"
          description="Manage which sidebar items are visible for different user roles."
          buttonText="Add New Role"
          onButtonClick={() => setIsAddModalOpen(true)}
        />

        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by role name..."
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

      <AddPermissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedPermission && (
        <>
          <EditPermissionModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            permission={selectedPermission}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedPermission.role_name}
          />
        </>
      )}
    </>
  );
};

export default SidebarPermissions;
