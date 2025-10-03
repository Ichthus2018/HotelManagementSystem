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
import AddPersonnelModal from "../../components/Admin/Modals/Personnel/AddPersonnelModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import EditPersonnelModal from "../../components/Admin/Modals/Personnel/EditPersonnelModal";
import ChangePasswordModal from "../../components/Admin/Modals/Personnel/ChangePasswordModal";

// Lazy-loaded View Component
const PersonnelList = lazy(() =>
  import("../../components/Admin/Modals/Personnel/Pages/PersonnelList")
);

const Personnel = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);

  const {
    data: personnel,
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
    tableName: "users", // Make sure this is the correct table
    selectQuery: "id, email, created_at, role, admin", // Explicitly select columns
    searchColumn: "email",
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

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
  };

  const openEditModal = (person) => {
    setSelectedPersonnel(person);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (person) => {
    console.log("Deleting personnel:", person);
    console.log("User ID:", person.id);
    console.log("User email:", person.email);
    setSelectedPersonnel(person);
    setIsDeleteModalOpen(true);
  };

  const openPasswordModal = (person) => {
    setSelectedPersonnel(person);
    setIsPasswordModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPersonnel) return;
    setIsProcessing(true);

    try {
      // Try multiple approaches
      const userId = selectedPersonnel.id;

      // Approach 1: Direct auth delete
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.log("Auth delete failed, trying public table only:", authError);

        // Approach 2: Delete from public table only
        const { error: publicError } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

        if (publicError) {
          throw new Error(`Delete failed: ${publicError.message}`);
        }

        console.log("Deleted from public table only");
      } else {
        console.log("Deleted from auth system");
      }

      mutate();
    } catch (err) {
      console.error("Failed to delete personnel:", err);
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedPersonnel(null);
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

    if (!personnel || personnel.length === 0) {
      return (
        <EmptyState
          title="No Personnel Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Add New Personnel" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <PersonnelList
          personnel={personnel}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onChangePassword={openPasswordModal}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="Manage Personnel"
          description="Add or manage team members and their permissions."
          buttonText="Add New Personnel"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by email..."
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

      <AddPersonnelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedPersonnel && (
        <>
          <EditPersonnelModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            personnel={selectedPersonnel}
          />

          <ChangePasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSuccess={handlePasswordSuccess}
            personnel={selectedPersonnel}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={
              selectedPersonnel.auth_users?.email || selectedPersonnel.email
            }
          />
        </>
      )}
    </>
  );
};

export default Personnel;
