// src/components/Admin/Modals/Housekeeping/IssuesModal.js

import { useState, useEffect } from "react";
import useSWR from "swr";
import supabase from "../../../services/supabaseClient";

// UI Components
import { Dialog } from "@headlessui/react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Loader from "./Loader";
import EmptyState from "./EmptyState";
import SearchInput from "./SearchInput";

const ITEMS_PER_PAGE = 10;

// Data fetcher for SWR. It fetches issues with related room and user data.
const fetchIssues = async ([_key, page, searchTerm]) => {
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("room_issues")
    .select(
      `
      id,
      created_at,
      description,
      status,
      room:rooms (room_number),
      reporter:users (first_name, last_name)
    `,
      { count: "exact" } // This is crucial for pagination!
    )
    .in("status", ["Reported", "In Progress"]) // Fetches only active issues
    .order("created_at", { ascending: false }); // Sort by date, newest first

  if (searchTerm) {
    query = query.ilike("description", `%${searchTerm}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching room issues:", error);
    throw error;
  }

  return { issues: data, count };
};

// A small component to display a single issue row
const IssueItem = ({ issue }) => {
  const reporterName = issue.reporter
    ? `${issue.reporter.first_name} ${issue.reporter.last_name}`
    : "System";

  // Simple status badge styling
  const statusColors = {
    Reported: "bg-yellow-100 text-yellow-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Resolved: "bg-green-100 text-green-800",
  };

  return (
    <li className="p-4 hover:bg-gray-50 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            Room {issue.room?.room_number || "N/A"}
          </p>
          <p className="mt-1 text-sm text-gray-600 truncate">
            {issue.description}
          </p>
        </div>
        <div className="ml-4 text-right">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              statusColors[issue.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {issue.status}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <p>
          Reported by: <span className="font-medium">{reporterName}</span>
        </p>
        <p>{new Date(issue.created_at).toLocaleString()}</p>
      </div>
    </li>
  );
};

const IssuesModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const swrKey = ["room_issues", currentPage, activeSearchTerm];
  const { data, error, isLoading } = useSWR(swrKey, fetchIssues, {
    keepPreviousData: true, // Prevents UI flashing on pagination
  });

  const issues = data?.issues || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(0);
      setSearchInput("");
      setActiveSearchTerm("");
    }
  }, [isOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    setActiveSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchTerm("");
    setCurrentPage(0);
  };

  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 text-red-600">
          Failed to load issues.
        </div>
      );
    }

    if (issues.length === 0) {
      return (
        <EmptyState
          title="No Active Issues Found"
          description={
            activeSearchTerm
              ? "Try adjusting your search."
              : "All reported issues have been resolved. Great work!"
          }
        />
      );
    }

    return (
      <ul className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <IssueItem key={issue.id} issue={issue} />
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="w-full max-w-2xl rounded-lg bg-white shadow-xl flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-xl font-bold text-gray-800">
              Active Room Issues History
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="p-4 border-b">
            <SearchInput
              searchTerm={searchInput}
              setSearchTerm={setSearchInput}
              onSearch={handleSearchSubmit}
              onClear={handleClearSearch}
              activeSearchTerm={activeSearchTerm}
              placeholder="Search by issue description..."
            />
          </div>

          <div className="flex-1 overflow-y-auto">{renderContent()}</div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0 || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage + 1 >= totalPages || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default IssuesModal;
