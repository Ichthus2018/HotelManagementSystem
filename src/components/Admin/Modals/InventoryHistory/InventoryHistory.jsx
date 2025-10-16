// src/pages/Admin/InventoryHistory.jsx

import React, { useState, lazy, Suspense, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { useInventoryHistoryData } from "../../../../hooks/Admin/useInventoryHistoryData";
import PageHeader from "../../../ui/common/PageHeader";
import EmptyState from "../../../ui/common/EmptyState";
import Loader from "../../../ui/common/loader";
import SearchInput from "../../../ui/common/SearchInput";

// Lazy-loaded List Component
const MovementList = lazy(() => import("./MovementList"));

const InventoryHistory = () => {
  // State for the controlled search input field
  const [searchTerm, setSearchTerm] = useState("");
  // State for the term that is actively being used to fetch data
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const {
    movements,
    totalCount,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    pageCount,
    pageSize,
  } = useInventoryHistoryData({
    filterText: activeSearchTerm,
    initialPageSize: 15,
  });

  // Reset to page 1 whenever a new search is performed
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [activeSearchTerm, currentPage, setCurrentPage]);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  // Triggers the search when the form is submitted
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
  };

  // Clears the search input and the active filter
  const handleClear = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Error: {error.message}
        </div>
      );

    if (!movements || movements.length === 0) {
      return (
        <EmptyState
          title="No Movements Found"
          description="No stock has been moved, used, or written off that matches your filters."
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <MovementList movements={movements} />
      </Suspense>
    );
  };

  return (
    <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
      <PageHeader
        title="Inventory History"
        description="View a detailed log of all stock movements, usage, and disposals."
      />
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeSearchTerm={activeSearchTerm}
        onSearch={handleSearch}
        onClear={handleClear}
        placeholder="Search by item name or reason..."
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
  );
};

export default InventoryHistory;
