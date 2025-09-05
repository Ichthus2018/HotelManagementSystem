import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useSupabaseQuery } from "../../hooks/common/useSupabaseQuery";
import supabase from "../../services/supabaseClient";

// Import Modals
import AddRoomTypeModal from "../../components/Admin/Modals/RoomType/AddRoomTypeModal";
import EditRoomTypeModal from "../../components/Admin/Modals/RoomType/EditRoomTypeModal";
import DeleteRoomTypeConfirmationModal from "../../components/Admin/Modals/RoomType/DeleteRoomTypeConfirmationModal";

import Loader from "../../components/ui/common/loader";

const RoomTypes = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    data: roomTypes,
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
    tableName: "room_types",
    selectQuery: "id, title, base_rate, guests_base, images", // Select images for deletion
    searchColumn: "title",
    initialPageSize: 5,
  });

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
    if (currentPage !== 1 || activeSearchTerm) {
      setCurrentPage(1);
      clearSearch();
    }
  };

  const openEditModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedRoomType(null);
    mutate();
  };

  const openDeleteModal = (roomType) => {
    setSelectedRoomType(roomType);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoomType) return;
    setIsProcessing(true);

    try {
      // 1. Delete associated images from storage
      if (selectedRoomType.images && selectedRoomType.images.length > 0) {
        // Extract file paths from URLs
        const filePaths = selectedRoomType.images.map((url) => {
          const parts = url.split("/");
          return parts[parts.length - 1]; // Assumes simple path structure
        });

        const { error: storageError } = await supabase.storage
          .from("room_type_images")
          .remove(filePaths);

        if (storageError) {
          console.error("Error deleting images from storage:", storageError);
          // Decide if you want to stop or continue if image deletion fails
        }
      }

      // 2. Delete the row from the database
      const { error: deleteError } = await supabase
        .from("room_types")
        .delete()
        .eq("id", selectedRoomType.id);

      if (deleteError) throw deleteError;

      if (roomTypes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete room type:", err);
      // Add a toast notification for the user
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedRoomType(null);
    }
  };

  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Room Title
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Base Rate
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Base Guests
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roomTypes.map((roomType) => (
            <tr key={roomType.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {roomType.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${Number(roomType.base_rate).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {roomType.guests_base}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  onClick={() => openEditModal(roomType)}
                  className="text-orange-600 hover:text-orange-900 p-1"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openDeleteModal(roomType)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-4">
      {roomTypes.map((roomType) => (
        <div
          key={roomType.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {roomType.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Rate: ${Number(roomType.base_rate).toFixed(2)} | Guests:{" "}
                {roomType.guests_base}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(roomType)}
                className="text-orange-600 hover:text-orange-900 p-1"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => openDeleteModal(roomType)}
                className="text-red-600 hover:text-red-900 p-1"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isLoading && !totalCount) {
      return (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 text-red-500">{error.message}</div>
      );
    }
    if (roomTypes.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <h4 className="font-semibold">
            {activeSearchTerm ? "No Results Found" : "No Room Types Yet"}
          </h4>
          <p>
            {activeSearchTerm
              ? "Try a different search term or clear the search."
              : 'Click "Add New" to get started.'}
          </p>
        </div>
      );
    }
    return isMobile ? renderMobileCards() : renderDesktopTable();
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 md:p-6 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Room Types
            </h2>
            <p className="text-sm text-gray-600">
              Configure your property room types here.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="sm:inline">Add New</span>
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full"
        >
          <div className="relative flex-grow w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by room title..."
              className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="hidden sm:flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Search
          </button>
          <button
            type="submit"
            className="sm:hidden p-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {activeSearchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </form>

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

      <AddRoomTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {selectedRoomType && (
        <>
          <EditRoomTypeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            roomType={selectedRoomType}
          />
          <DeleteRoomTypeConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedRoomType.title}
          />
        </>
      )}
    </>
  );
};

export default RoomTypes;
