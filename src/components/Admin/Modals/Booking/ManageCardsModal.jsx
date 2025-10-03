// src/components/.../ManageCardsModal.js

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import axios from "axios"; // Import axios
import { API_BASE_URL } from "../../../../services/api"; // Your API base URL
import {
  X,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  KeyRound,
  Loader2,
  Info,
} from "lucide-react";

import AddCardForm from "./cards/AddCardForm";
import EditCardForm from "./cards/EditCardForm";

const ManageCardsModal = ({ isOpen, onClose, booking }) => {
  const [view, setView] = useState("chooser");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [cardToEdit, setCardToEdit] = useState(null);

  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // For delete operations
  const [error, setError] = useState(null);

  const fetchBookingCards = async () => {
    if (!booking) return;
    setIsLoading(true);
    setError(null);
    try {
      // Ensure you select the lock_id and the card_id_on_lock
      const { data, error } = await supabase
        .from("booking_cards")
        .select(`*, rooms(room_number, lock_id)`)
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error("Error fetching booking cards:", err);
      setError("Failed to fetch card information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset view to chooser every time modal is opened
      setView("chooser");
      fetchBookingCards();
    }
  }, [isOpen, booking]);

  const handleClose = () => {
    setView("chooser");
    setSelectedRoom(null);
    setCardToEdit(null);
    onClose();
  };

  // --- NEW: Refactored Delete Handler ---
  const handleDeleteCard = async (cardToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete card "${cardToDelete.card_name}" from the lock and database?`
      )
    )
      return;

    if (!cardToDelete.rooms?.lock_id || !cardToDelete.card_id_on_lock) {
      alert(
        "Error: Card is missing lock information. Cannot delete from lock."
      );
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Delete from TTLock API first
      await axios.delete(
        `${API_BASE_URL}/locks/${cardToDelete.rooms.lock_id}/cards/${cardToDelete.card_id_on_lock}`
      );

      // 2. If successful, delete from Supabase DB
      const { error: dbError } = await supabase
        .from("booking_cards")
        .delete()
        .eq("id", cardToDelete.id);

      if (dbError) throw dbError;

      alert("Card deleted successfully.");
      fetchBookingCards(); // Refresh list
    } catch (err) {
      console.error("Failed to delete card:", err);
      const apiErrorMessage = err.response?.data?.error || err.message;
      alert(`Error deleting card: ${apiErrorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- NEW: Refactored Delete All Handler ---
  const handleDeleteAllGuestCards = async () => {
    const guestCards = cards.filter((c) => c.card_type === "guest");
    if (guestCards.length === 0) {
      alert("No guest cards to delete.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete all ${guestCards.length} guest cards for this booking from the locks and database?`
      )
    )
      return;

    setIsProcessing(true);
    try {
      // 1. Create all API delete promises
      const deletePromises = guestCards.map((card) => {
        if (!card.rooms?.lock_id || !card.card_id_on_lock) {
          console.warn(
            `Skipping card ${card.card_name} due to missing lock info.`
          );
          return Promise.resolve(); // Resolve immediately if info is missing
        }
        return axios.delete(
          `${API_BASE_URL}/locks/${card.rooms.lock_id}/cards/${card.card_id_on_lock}`
        );
      });

      // Execute all API calls
      await Promise.all(deletePromises);

      // 2. If all API calls were successful, delete from Supabase DB
      const cardIdsToDelete = guestCards.map((c) => c.id);
      const { error: dbError } = await supabase
        .from("booking_cards")
        .delete()
        .in("id", cardIdsToDelete);

      if (dbError) throw dbError;

      alert("All guest cards have been deleted successfully.");
      fetchBookingCards();
    } catch (err) {
      console.error("Failed to delete all guest cards:", err);
      const apiErrorMessage = err.response?.data?.error || err.message;
      alert(`An error occurred while deleting cards: ${apiErrorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHeader = () => {
    let title = "Manage Cards";
    if (view === "add" && !selectedRoom) title = "Step 1: Select a Room";
    if (view === "add" && selectedRoom)
      title = `Step 2: Add Card to Room ${selectedRoom.rooms.room_number}`;
    if (view === "edit") title = "Select a Card to Edit";
    if (view === "edit" && cardToEdit)
      title = `Editing Card: ${cardToEdit.card_name}`;
    if (view === "delete") title = "Select a Card to Delete";

    return (
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    );
  };

  // --- START OF RENDER CONTENT ---
  const renderContent = () => {
    // Top-level loading and error states
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    // --- VIEW 1: Chooser (Main View with Card List) ---
    if (view === "chooser") {
      return (
        <div className="p-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setView("add")}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-300 transition-colors"
            >
              <Plus className="w-10 h-10 text-blue-600 mb-2" />
              <span className="font-semibold text-blue-800">Add Card</span>
            </button>
            <button
              onClick={() => setView("edit")}
              disabled={cards.length === 0}
              className="flex flex-col items-center justify-center p-6 bg-yellow-50 hover:bg-yellow-100 rounded-lg border-2 border-dashed border-yellow-400 transition-colors disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed"
            >
              <Edit className="w-10 h-10 text-yellow-600 mb-2 disabled:text-gray-400" />
              <span className="font-semibold text-yellow-800 disabled:text-gray-500">
                Edit Cards
              </span>
            </button>
            <button
              onClick={() => setView("delete")}
              disabled={cards.length === 0}
              className="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-dashed border-red-300 transition-colors disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-10 h-10 text-red-600 mb-2 disabled:text-gray-400" />
              <span className="font-semibold text-red-800 disabled:text-gray-500">
                Delete Cards
              </span>
            </button>
          </div>

          {/* Divider and Title */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-800">Registered Cards</h4>
          </div>

          {/* Card List */}
          {cards.length === 0 ? (
            <div className="text-center text-gray-500 py-12 flex flex-col items-center">
              <Info className="w-8 h-8 text-gray-400 mb-2" />
              <p>No cards have been registered for this booking yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 mt-2">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{card.card_name}</p>
                    <p className="text-sm text-gray-500">
                      Room: {card.rooms.room_number} | Number:{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {card.card_number}
                      </span>
                    </p>
                  </div>
                  {/* No action buttons here, actions are performed from the main buttons */}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // --- VIEW 2: ADD FLOW ---
    if (view === "add") {
      if (!selectedRoom) {
        return (
          <div className="p-4 space-y-3">
            <button
              onClick={() => setView("chooser")}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to options
            </button>
            {booking.booking_rooms.map((br) => (
              <div
                key={br.id}
                onClick={() => setSelectedRoom(br)}
                className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">Room {br.rooms.room_number}</p>
                  <p className="text-sm text-gray-500 font-mono">
                    Lock ID: {br.rooms.lock_id || "Not Set"}
                  </p>
                </div>
                <KeyRound className="w-6 h-6 text-gray-400" />
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="p-4">
          <button
            onClick={() => setSelectedRoom(null)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to room selection
          </button>
          <AddCardForm
            room={selectedRoom}
            booking={booking}
            onSuccess={() => {
              fetchBookingCards();
              setSelectedRoom(null);
              setView("chooser");
              alert("Card added successfully!");
            }}
          />
        </div>
      );
    }

    // --- VIEW 3: Edit List & Form ---
    if (view === "edit") {
      if (cardToEdit) {
        return (
          <div className="p-4">
            <button
              onClick={() => setCardToEdit(null)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to card list
            </button>
            <EditCardForm
              card={cardToEdit}
              onSuccess={() => {
                fetchBookingCards();
                setCardToEdit(null);
                setView("chooser"); // Return to main view on success
                alert("Card updated successfully!");
              }}
            />
          </div>
        );
      }
      return (
        <div className="p-4 space-y-4">
          <button
            onClick={() => setView("chooser")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to options
          </button>
          <ul className="divide-y divide-gray-200">
            {cards.map((card) => (
              <li
                key={card.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{card.card_name}</p>
                  <p className="text-sm text-gray-500">
                    Room: {card.rooms.room_number} | Number:{" "}
                    <span className="font-mono">{card.card_number}</span>
                  </p>
                </div>
                <button
                  onClick={() => setCardToEdit(card)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <Edit className="w-5 h-5 text-yellow-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // --- VIEW 4: Delete List ---
    if (view === "delete") {
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setView("chooser")}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to options
            </button>
            <button
              onClick={handleDeleteAllGuestCards}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete All Guest Cards
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {cards.map((card) => (
              <li
                key={card.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{card.card_name}</p>
                  <p className="text-sm text-gray-500">
                    Room: {card.rooms.room_number} | Number:{" "}
                    <span className="font-mono">{card.card_number}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCard(card)}
                  disabled={isProcessing}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  };
  // --- END OF RENDER CONTENT ---

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {renderHeader()}
                <div className="min-h-[200px]">{renderContent()}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ManageCardsModal;
