import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";
import SearchInput from "../../components/ui/common/SearchInput"; // Added search
import {
  LockClosedIcon,
  PlusIcon,
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// New & Refactored Components (Lazy Loaded)
const CardList = lazy(() =>
  import("../../components/Admin/Modals/Cards/CardList")
);
import AddCardModal from "../../components/Admin/Modals/Cards/AddCardModal";
import EditCardModal from "../../components/Admin/Modals/Cards/EditCardModal";
import ClearCardsModal from "../../components/Admin/Modals/Cards/ClearCardsModal";
import DeleteConfirmationModal from "../../components/ui/common/DeleteConfirmationModal";
import { API_BASE_URL } from "../../services/api";

const LockCardManager = () => {
  // State for data
  const [locks, setLocks] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedLockId, setSelectedLockId] = useState("");

  // State for UI control
  const [isLoadingLocks, setIsLoadingLocks] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // State for modals
  const [modalState, setModalState] = useState({
    add: false,
    edit: false,
    delete: false,
    clear: false,
  });
  const [selectedCard, setSelectedCard] = useState(null);

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- DERIVED & MEMOIZED DATA ---

  const selectedLock = useMemo(
    () => locks.find((lock) => lock.lockId === parseInt(selectedLockId)),
    [locks, selectedLockId]
  );

  const filteredCards = useMemo(() => {
    if (!searchTerm) return cards;
    return cards.filter(
      (card) =>
        card.cardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cards, searchTerm]);

  const pageCount = Math.ceil(filteredCards.length / pageSize);
  const currentCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, currentPage, pageSize]);

  // --- DATA FETCHING ---

  useEffect(() => {
    const fetchLocks = async () => {
      setIsLoadingLocks(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/locks`);
        setLocks(response.data.list || []);
      } catch (err) {
        setError("Failed to fetch locks. Make sure the API server is running.");
        console.error(err);
      } finally {
        setIsLoadingLocks(false);
      }
    };
    fetchLocks();
  }, []);

  useEffect(() => {
    if (!selectedLockId) {
      setCards([]);
      return;
    }
    const fetchCardsForLock = async () => {
      setIsLoadingCards(true);
      clearMessages();
      try {
        const response = await axios.get(
          `${API_BASE_URL}/locks/${selectedLockId}/cards`
        );
        setCards(response.data.list || []);
      } catch (err) {
        setError(
          `Failed to fetch cards for lock "${selectedLock?.lockAlias}".`
        );
        console.error(err);
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchCardsForLock();
  }, [selectedLockId]); // Simplified dependency

  // --- UTILITY & HANDLERS ---

  const clearMessages = () => {
    setError(null);
    setSuccessMessage("");
  };

  const showSuccessMessage = (message) => {
    clearMessages();
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000); // Hide after 4 seconds
  };

  const handleModal = (modal, state, card = null) => {
    setModalState((prev) => ({ ...prev, [modal]: state }));
    if (card) setSelectedCard(card);
    if (!state) setSelectedCard(null);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // --- API ACTION HANDLERS ---

  const handleAddSuccess = (newCard) => {
    setCards((prev) => [newCard, ...prev]);
    showSuccessMessage(`Successfully added card "${newCard.cardName}".`);
    handleModal("add", false);
  };

  const handleEditSuccess = async (updatedCard) => {
    const originalCards = cards;
    // Optimistic UI update
    setCards((prev) =>
      prev.map((c) => (c.cardId === updatedCard.cardId ? updatedCard : c))
    );
    handleModal("edit", false);

    try {
      await axios.put(
        `${API_BASE_URL}/locks/${updatedCard.lockId}/cards/${updatedCard.cardId}`,
        {
          cardName: updatedCard.cardName,
          startDate: updatedCard.startDate,
          endDate: updatedCard.endDate,
        }
      );
      showSuccessMessage(
        `Successfully updated card "${updatedCard.cardName}".`
      );
    } catch (err) {
      setError("Failed to update card. Reverting changes.");
      console.error(err);
      setCards(originalCards); // Revert on failure
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCard) return;
    const originalCards = cards;
    // Optimistic UI update
    setCards((prev) => prev.filter((c) => c.cardId !== selectedCard.cardId));
    handleModal("delete", false);

    try {
      await axios.delete(
        `${API_BASE_URL}/locks/${selectedCard.lockId}/cards/${selectedCard.cardId}`
      );
      showSuccessMessage("Successfully deleted the card.");
    } catch (err) {
      setError("Failed to delete card. Reverting changes.");
      console.error(err);
      setCards(originalCards); // Revert on failure
    }
  };

  const handleClearConfirm = async () => {
    if (!selectedLockId) return;
    const originalCards = cards;
    setCards([]); // Optimistic clear
    handleModal("clear", false);

    try {
      await axios.post(`${API_BASE_URL}/locks/${selectedLockId}/cards/clear`);
      showSuccessMessage(
        `All cards cleared for lock "${selectedLock?.lockAlias}".`
      );
    } catch (err) {
      setError("Failed to clear cards. Reverting changes.");
      console.error(err);
      setCards(originalCards); // Revert on failure
    }
  };

  // --- RENDER LOGIC ---

  const renderContent = () => {
    if (!selectedLockId) {
      return (
        <EmptyState
          Icon={LockClosedIcon}
          title="No Lock Selected"
          description="Please select a lock from the dropdown to manage its IC cards."
        />
      );
    }
    if (isLoadingCards) return <Loader />;
    if (filteredCards.length === 0) {
      return (
        <EmptyState
          title="No IC Cards Found"
          description={
            searchTerm
              ? `No cards found for "${searchTerm}".`
              : `There are no IC cards registered for "${selectedLock?.lockAlias}".`
          }
        />
      );
    }
    return (
      <Suspense fallback={<Loader />}>
        <CardList
          cards={currentCards}
          onEdit={(card) => handleModal("edit", true, card)}
          onDelete={(card) => handleModal("delete", true, card)}
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="IC Card Management"
          description="Select a lock to view, issue, or revoke IC card access."
        />

        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="lock-selector" className="sr-only">
              Select a lock
            </label>
            <select
              id="lock-selector"
              value={selectedLockId}
              onChange={(e) => {
                setSelectedLockId(e.target.value);
                setCurrentPage(1);
                setSearchTerm("");
              }}
              disabled={isLoadingLocks}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base h-12"
            >
              <option value="">
                {isLoadingLocks ? "Loading locks..." : "--- Select a Lock ---"}
              </option>
              {locks.map((lock) => (
                <option key={lock.lockId} value={lock.lockId}>
                  {lock.lockAlias} (ID: {lock.lockId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleModal("add", true)}
              disabled={!selectedLockId}
              className="inline-flex items-center gap-2 justify-center w-full sm:w-auto rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" /> Add Card
            </button>
            <button
              onClick={() => handleModal("clear", true)}
              disabled={!selectedLockId || cards.length === 0}
              className="inline-flex items-center gap-2 justify-center w-full sm:w-auto rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ArchiveBoxXMarkIcon className="h-5 w-5" /> Clear All
            </button>
          </div>
        </div>

        {/* Search and Feedback Area */}
        {selectedLockId && !isLoadingCards && (
          <div className="px-4">
            <SearchInput
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search by card name or number..."
            />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mx-4">
            <XCircleIcon className="h-5 w-5" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md mx-4">
            <CheckCircleIcon className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {renderContent()}
          {pageCount > 1 && (
            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50/50">
              <ReactPaginate
                breakLabel="..."
                nextLabel="Next ›"
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                previousLabel="‹ Prev"
                forcePage={currentPage - 1}
                containerClassName="flex items-center justify-center gap-2 text-sm font-medium"
                pageLinkClassName="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100"
                activeLinkClassName="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                previousLinkClassName="px-3 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100"
                nextLinkClassName="px-3 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-800 bg-white hover:bg-gray-100"
                disabledLinkClassName="opacity-50 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {selectedLockId && (
        <AddCardModal
          isOpen={modalState.add}
          onClose={() => handleModal("add", false)}
          onSuccess={handleAddSuccess}
          lockId={selectedLockId}
          lockAlias={selectedLock?.lockAlias}
        />
      )}
      {selectedCard && (
        <EditCardModal
          isOpen={modalState.edit}
          onClose={() => handleModal("edit", false)}
          onSuccess={handleEditSuccess}
          card={selectedCard}
        />
      )}
      {selectedCard && (
        <DeleteConfirmationModal
          isOpen={modalState.delete}
          onClose={() => handleModal("delete", false)}
          onConfirm={handleDeleteConfirm}
          itemName={`card "${
            selectedCard.cardName || selectedCard.cardNumber
          }"`}
        />
      )}
      {selectedLockId && (
        <ClearCardsModal
          isOpen={modalState.clear}
          onClose={() => handleModal("clear", false)}
          onConfirm={handleClearConfirm}
          lockAlias={selectedLock?.lockAlias}
        />
      )}
    </>
  );
};

export default LockCardManager;
