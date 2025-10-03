import { useState, useEffect, useMemo } from "react";
import axios from "axios";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";
import {
  LockClosedIcon,
  PlusIcon,
  ArchiveBoxXMarkIcon,
} from "@heroicons/react/24/outline";

// New & Refactored Components
import CardList from "../../components/Admin/Modals/Cards/CardList";
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

  // State for modals
  const [modalState, setModalState] = useState({
    add: false,
    edit: false,
    delete: false,
    clear: false,
  });
  const [selectedCard, setSelectedCard] = useState(null);

  // Memoize the selected lock object to avoid recalculating
  const selectedLock = useMemo(
    () => locks.find((lock) => lock.lockId === parseInt(selectedLockId)),
    [locks, selectedLockId]
  );

  // --- DATA FETCHING ---

  // Effect to fetch all locks on component mount
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

  // Effect to fetch cards when a lock is selected
  useEffect(() => {
    if (!selectedLockId) {
      setCards([]);
      return;
    }

    const fetchCardsForLock = async () => {
      setIsLoadingCards(true);
      setError(null);
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
  }, [selectedLockId, selectedLock]);

  // --- HANDLERS FOR MODALS & ACTIONS ---

  const handleModal = (modal, state, card = null) => {
    setModalState((prev) => ({ ...prev, [modal]: state }));
    if (card) setSelectedCard(card);
    if (!state) setSelectedCard(null);
  };

  // Optimistically update UI and then sync with server
  const handleAddSuccess = (newCard) => {
    setCards((prev) => [newCard, ...prev]);
    handleModal("add", false);
  };

  const handleEditSuccess = (updatedCard) => {
    setCards((prev) =>
      prev.map((c) => (c.cardId === updatedCard.cardId ? updatedCard : c))
    );
    handleModal("edit", false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCard) return;

    // Optimistic UI update
    const originalCards = cards;
    setCards((prev) => prev.filter((c) => c.cardId !== selectedCard.cardId));
    handleModal("delete", false);

    try {
      await axios.delete(
        `${API_BASE_URL}/locks/${selectedCard.lockId}/cards/${selectedCard.cardId}`
      );
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
          description="Please select a lock from the dropdown above to view and manage its IC cards."
        />
      );
    }
    if (isLoadingCards) return <Loader />;
    if (error && !isLoadingCards)
      return <div className="text-center text-red-500 p-6">{error}</div>;

    if (cards.length === 0) {
      return (
        <EmptyState
          title="No IC Cards Found"
          description={`There are no IC cards registered for the lock "${selectedLock?.lockAlias}".`}
        />
      );
    }

    return (
      <CardList
        cards={cards}
        onEdit={(card) => handleModal("edit", true, card)}
        onDelete={(card) => handleModal("delete", true, card)}
      />
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="IC Card Management"
          description="Select a lock to view, issue, or revoke IC card access."
        />

        {/* --- Lock Selector & Action Bar --- */}
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="lock-selector" className="sr-only">
              Select a lock
            </label>
            <select
              id="lock-selector"
              value={selectedLockId}
              onChange={(e) => setSelectedLockId(e.target.value)}
              disabled={isLoadingLocks}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base h-12"
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
              className="inline-flex items-center gap-2 justify-center w-full sm:w-auto rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
              Add Card
            </button>
            <button
              onClick={() => handleModal("clear", true)}
              disabled={!selectedLockId || cards.length === 0}
              className="inline-flex items-center gap-2 justify-center w-full sm:w-auto rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ArchiveBoxXMarkIcon className="h-5 w-5" />
              Clear All Cards
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 px-4">{error}</p>}

        {/* --- Card List Display --- */}
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {renderContent()}
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
