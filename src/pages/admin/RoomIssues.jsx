import { useState, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks/useUser"; // To get the current user for reporting

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";

// Modals
import AddRoomIssueModal from "../../components/Admin/Modals/RoomIssues/AddRoomIssueModal";
import EditRoomIssueModal from "../../components/Admin/Modals/RoomIssues/EditRoomIssueModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const RoomIssueList = lazy(() =>
  import("../../components/Admin/Modals/RoomIssues/Pages/RoomIssueList")
);

const RoomIssues = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const { user: currentUser } = useUser(); // Get the current authenticated user

  const {
    data: issues,
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
    tableName: "room_issues",
    selectQuery: `
    *,
    rooms(room_number),
    reporter:users!reported_by(first_name, last_name)
  `,
    searchColumn: "description",
    initialPageSize: 10,

    filters: currentUser?.id
      ? [{ column: "reported_by", value: currentUser.id }]
      : [],
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

  const openEditModal = (issue) => {
    setSelectedIssue(issue);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (issue) => {
    setSelectedIssue(issue);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIssue) return;
    setIsProcessing(true);

    // Optimistic UI update
    const updatedData = issues.filter((iss) => iss.id !== selectedIssue.id);
    await mutate(
      { data: updatedData, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      const { error: deleteError } = await supabase
        .from("room_issues")
        .delete()
        .eq("id", selectedIssue.id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Failed to delete issue:", err);
      mutate(); // Revalidate if delete fails
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedIssue(null);
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

    if (!issues || issues.length === 0) {
      return (
        <EmptyState
          title="No Room Issues Found"
          description={
            activeSearchTerm
              ? `No results for "${activeSearchTerm}".`
              : 'Click "Report New Issue" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <RoomIssueList
          issues={issues}
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
          title="Manage Room Issues"
          description="Report, track, and resolve maintenance or cleaning issues for rooms."
          buttonText="Report New Issue"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by issue description..."
        />

        <div className="overflow-x-auto">
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

      <AddRoomIssueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        currentUser={currentUser}
      />

      {selectedIssue && (
        <>
          <EditRoomIssueModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            issue={selectedIssue}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={`issue for room ${selectedIssue.room?.room_number || ""}`}
          />
        </>
      )}
    </>
  );
};

export default RoomIssues;
