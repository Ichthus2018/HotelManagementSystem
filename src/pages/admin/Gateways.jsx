// File: src/pages/Admin/Gateways.jsx

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import ReactPaginate from "react-paginate";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";

// Modals
import AddGatewayModal from "../../components/Admin/Modals/Gateway/AddGatewayModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import GatewayLocksModal from "../../components/Admin/Modals/Gateway/Pages/GatewayLocksModal";
// --- 1. Import the new modal ---
import RenameGatewayModal from "../../components/Admin/Modals/Gateway/Pages/RenameGatewayModal";

// Lazy-loaded View Component
const GatewayList = lazy(() =>
  import("../../components/Admin/Modals/Gateway/Pages/GatewayList")
);

const API_URL = "http://localhost:5000/api/gateways";
const PAGE_SIZE = 10;

const Gateways = () => {
  // --- State Management ---
  const [allGateways, setAllGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [isLocksModalOpen, setIsLocksModalOpen] = useState(false);
  const [gatewayForLocks, setGatewayForLocks] = useState(null);
  // --- 2. Add state for the rename modal ---
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchGateways = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const mappedData = data.list.map((gw) => ({
          id: gw.gatewayId,
          ttlock_gateway_id: gw.gatewayId,
          name: gw.gatewayName,
          is_online: gw.isOnline === 1,
          gatewayMac: gw.gatewayMac,
        }));
        setAllGateways(mappedData);
      } catch (err) {
        setError(err);
        console.error("Failed to fetch gateways:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGateways();
  }, []);

  // --- Client-Side Search & Pagination Logic (omitted for brevity, no changes) ---
  const filteredGateways = useMemo(() => {
    if (!activeSearchTerm) return allGateways;
    return allGateways.filter((gateway) =>
      gateway.name.toLowerCase().includes(activeSearchTerm.toLowerCase())
    );
  }, [allGateways, activeSearchTerm]); // <-- The dependency is activeSearchTerm

  const pageCount = Math.ceil(filteredGateways.length / PAGE_SIZE);
  const paginatedGateways = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredGateways.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredGateways, currentPage]);

  // --- Event Handlers ---
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
  };

  const openDeleteModal = (gateway) => {
    setSelectedGateway(gateway);
    setIsDeleteModalOpen(true);
  };

  // --- 3. Add handler to open the rename modal ---
  const openRenameModal = (gateway) => {
    setSelectedGateway(gateway);
    setIsRenameModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGateway) return;
    setIsProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/gateways/${selectedGateway.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete the gateway.");
      }
      setAllGateways((prevGateways) =>
        prevGateways.filter((g) => g.id !== selectedGateway.id)
      );
      setIsDeleteModalOpen(false);
      setSelectedGateway(null);
    } catch (err) {
      console.error("Deletion failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 4. Add handler to process the rename action ---
  const handleConfirmRename = async (newName) => {
    if (!selectedGateway) return;
    setIsProcessing(true);

    try {
      // This fetch call should point to your backend, which then calls the TTLock API
      const response = await fetch(
        `http://localhost:5000/api/gateways/rename`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gatewayId: selectedGateway.id,
            gatewayName: newName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to rename the gateway.");
      }

      // Update the UI state upon successful rename
      setAllGateways((prevGateways) =>
        prevGateways.map((gw) =>
          gw.id === selectedGateway.id ? { ...gw, name: newName } : gw
        )
      );

      setIsRenameModalOpen(false);
      setSelectedGateway(null);
    } catch (err) {
      console.error("Rename failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewLocks = (gateway) => {
    setGatewayForLocks(gateway);
    setIsLocksModalOpen(true);
  };

  // --- Content Rendering ---
  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error) {
      return (
        <div className="text-center text-red-500 p-8">
          <h3 className="text-lg font-semibold">Failed to load data</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }
    if (paginatedGateways.length === 0) {
      return (
        <EmptyState
          title="No Gateways Found"
          description={
            activeSearchTerm
              ? `Your search for "${activeSearchTerm}" did not return any results.`
              : 'Click "Add New Gateway" to get started.'
          }
        />
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <GatewayList
          gateways={paginatedGateways}
          onDelete={openDeleteModal}
          onViewLocks={handleViewLocks}
          onRename={openRenameModal} // <-- 5. Pass the handler to the list
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 pt-10 md:p-6 lg:p-8 max-w-7xl min-h-screen">
        <PageHeader
          title="Manage Gateways"
          description="View, add, or remove TTLock gateways from your account."
          buttonText="Add New Gateway"
          onButtonClick={() => setIsAddModalOpen(true)}
        />
        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by gateway name..."
        />
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {renderContent()}
          {filteredGateways.length > PAGE_SIZE && (
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <ReactPaginate
              // (Pagination props omitted for brevity, no changes)
              />
            </div>
          )}
        </div>
      </div>

      <AddGatewayModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {gatewayForLocks && (
        <GatewayLocksModal
          isOpen={isLocksModalOpen}
          onClose={() => setIsLocksModalOpen(false)}
          gateway={gatewayForLocks}
        />
      )}

      {/* --- 6. Render the new modal --- */}
      {selectedGateway && (
        <>
          <RenameGatewayModal
            isOpen={isRenameModalOpen}
            onClose={() => setIsRenameModalOpen(false)}
            onConfirm={handleConfirmRename}
            isProcessing={isProcessing}
            gateway={selectedGateway}
          />
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedGateway.name || `Gateway #${selectedGateway.id}`}
          />
        </>
      )}
    </>
  );
};

export default Gateways;
