import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader"; // Fallback loader

// Modals
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";

// Lazy-loaded View Component
const DoorLockList = lazy(() =>
  import("../../components/Admin/Modals/DoorLock/Pages/DoorLockList")
);

const DoorLocks = () => {
  // State for data, loading, and errors
  const [allLocks, setAllLocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for UI interactions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [selectedLock, setSelectedLock] = useState(null);

  // State for client-side search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch data from the local API on component mount
  useEffect(() => {
    const fetchLocks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/locks");
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();

        // Handle API-specific errors returned in the response body
        if (data.errcode && data.errcode !== 0) {
          throw new Error(
            data.errmsg || "Failed to fetch locks from TTLock API"
          );
        }

        // Map the API data to a consistent format for the UI
        const mappedLocks = data.list.map((lock) => ({
          id: lock.lockId,
          name: lock.lockAlias,
          battery_level: lock.electricQuantity,
          lockMac: lock.lockMac,
          hasGateway: lock.hasGateway === 1,
        }));
        setAllLocks(mappedLocks);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch door locks:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocks();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Memoized client-side filtering
  const filteredLocks = useMemo(() => {
    if (!searchTerm) return allLocks;
    return allLocks.filter((lock) =>
      lock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLocks, searchTerm]);

  // Memoized client-side pagination
  const pageCount = Math.ceil(filteredLocks.length / pageSize);
  const currentLocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocks.slice(start, start + pageSize);
  }, [filteredLocks, currentPage, pageSize]);

  // --- Handlers ---

  const openDeleteModal = (lock) => {
    setSelectedLock(lock);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLock) return;
    setIsProcessingDelete(true);

    // NOTE: The provided API does not have a DELETE endpoint for locks.
    // This simulates the deletion on the client-side for demonstration purposes.
    console.log(
      `SIMULATING DELETE: A call to a DELETE /api/locks/${selectedLock.id} endpoint would be made here.`
    );

    // Simulate network delay for better UX
    setTimeout(() => {
      setAllLocks((prevLocks) =>
        prevLocks.filter((l) => l.id !== selectedLock.id)
      );
      setIsProcessingDelete(false);
      setIsDeleteModalOpen(false);
      setSelectedLock(null);
    }, 500);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // --- Render Logic ---

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error) {
      return (
        <div className="text-center p-10">
          <h3 className="text-lg font-semibold text-red-600">
            Failed to load data
          </h3>
          <p className="text-gray-500 mt-2">Error: {error}</p>
        </div>
      );
    }
    if (filteredLocks.length === 0) {
      return (
        <EmptyState
          title="No Door Locks Found"
          description={
            searchTerm
              ? `No results for "${searchTerm}". Try a different search term.`
              : "No locks were found. Check your API connection."
          }
        />
      );
    }
    return (
      <Suspense fallback={<Loader />}>
        <DoorLockList doorLocks={currentLocks} onDelete={openDeleteModal} />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-7xl xl:px-12 min-h-screen">
        <PageHeader
          title="Manage Door Locks"
          description="View and manage TTLock door locks synced from your account."
          // Add button is disabled as the API doesn't support it
        />
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
          placeholder="Search by lock name..."
        />

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          {renderContent()}
          {filteredLocks.length > pageSize && (
            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50/50">
              <ReactPaginate
                breakLabel="..."
                nextLabel="Next ›"
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                previousLabel="‹ Prev"
                renderOnZeroPageCount={null}
                forcePage={currentPage - 1}
                containerClassName="flex items-center justify-center gap-2 text-sm font-medium"
                pageLinkClassName="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100 transition duration-200 cursor-pointer"
                activeLinkClassName="bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                previousLinkClassName="px-3 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100 transition duration-200 cursor-pointer"
                nextLinkClassName="px-3 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100 transition duration-200 cursor-pointer"
                disabledLinkClassName="opacity-50 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </div>

      {selectedLock && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isProcessingDelete}
          itemName={selectedLock.name}
          itemType="door lock"
        />
      )}
    </>
  );
};

export default DoorLocks;
