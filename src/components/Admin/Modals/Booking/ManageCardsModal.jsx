import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import {
  X,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  KeyRound,
  Loader2,
} from "lucide-react";

// The new form components we are about to create
import AddCardForm from "./cards/AddCardForm";
import EditCardForm from "./cards/EditCardForm";

const ManageCardsModal = ({ isOpen, onClose, booking }) => {
  // Controls which view is visible: 'chooser', 'add', 'edit', 'delete'
  const [view, setView] = useState("chooser");
  // Stores the room selected in the 'add' flow
  const [selectedRoom, setSelectedRoom] = useState(null);
  // Stores the card selected in the 'edit' flow
  const [cardToEdit, setCardToEdit] = useState(null);

  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all cards associated with this booking when the modal opens
  const fetchBookingCards = async () => {
    if (!booking) return;
    setIsLoading(true);
    setError(null);
    try {
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
      fetchBookingCards();
    }
  }, [isOpen, booking]);

  const handleClose = () => {
    setView("chooser");
    setSelectedRoom(null);
    setCardToEdit(null); // Reset card to edit on close
    onClose();
  };

  // Handler for deleting a single card
  const handleDeleteCard = async (cardToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete card "${cardToDelete.card_name}"?`
      )
    )
      return;

    try {
      // NOTE: Here you would call an edge function to delete from the physical lock first.
      // For now, we'll just delete from the database.
      const { error } = await supabase
        .from("booking_cards")
        .delete()
        .eq("id", cardToDelete.id);

      if (error) throw error;

      fetchBookingCards(); // Refresh the UI
      alert("Card deleted successfully.");
    } catch (err) {
      console.error("Failed to delete card:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handler for deleting all GUEST cards for this booking
  const handleDeleteAllGuestCards = async () => {
    const guestCards = cards.filter((c) => c.card_type === "guest");
    if (guestCards.length === 0) {
      alert("No guest cards to delete.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete all ${guestCards.length} guest cards for this booking?`
      )
    )
      return;

    try {
      const cardIdsToDelete = guestCards.map((c) => c.id);
      const { error } = await supabase
        .from("booking_cards")
        .delete()
        .in("id", cardIdsToDelete);

      if (error) throw error;

      fetchBookingCards();
      alert("All guest cards have been deleted.");
    } catch (err) {
      console.error("Failed to delete all guest cards:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const renderHeader = () => {
    let title = "Manage Cards";
    if (view === "add" && !selectedRoom) title = "Step 1: Select a Room";
    if (view === "add" && selectedRoom)
      title = `Step 2: Add Card to Room ${selectedRoom.rooms.room_number}`;
    if (view === "edit" && !cardToEdit) title = "Edit Registered Cards";
    if (view === "edit" && cardToEdit)
      title = `Editing Card: ${cardToEdit.card_name}`;
    if (view === "delete") title = "Delete Registered Cards";

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

  const renderContent = () => {
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

    // --- VIEW 1: Chooser ---
    if (view === "chooser") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <button
            onClick={() => setView("add")}
            className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-300"
          >
            <Plus className="w-10 h-10 text-blue-600 mb-2" />
            <span className="font-semibold text-blue-800">Add Card</span>
          </button>
          <button
            onClick={() => setView("edit")}
            className="flex flex-col items-center justify-center p-6 bg-yellow-50 hover:bg-yellow-100 rounded-lg border-2 border-dashed border-yellow-400"
          >
            <Edit className="w-10 h-10 text-yellow-600 mb-2" />
            <span className="font-semibold text-yellow-800">Edit Cards</span>
          </button>
          <button
            onClick={() => setView("delete")}
            className="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-dashed border-red-300"
          >
            <Trash2 className="w-10 h-10 text-red-600 mb-2" />
            <span className="font-semibold text-red-800">Delete Cards</span>
          </button>
        </div>
      );
    }

    // --- VIEW 2: ADD FLOW ---
    if (view === "add") {
      // Step 2.1: Select a room
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
      // Step 2.2: Show the Add Card form for the selected room
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
              setView("chooser"); // Go back to main menu on success
              alert("Card added successfully!");
            }}
          />
        </div>
      );
    }

    // --- VIEW 3: Edit List & Form ---
    if (view === "edit") {
      // If a card has been selected, show the edit form
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
                setCardToEdit(null); // Go back to list on success
                alert("Card updated successfully!");
              }}
            />
          </div>
        );
      }
      // Otherwise, show the list of cards to choose from
      return (
        <div className="p-4 space-y-4">
          <button
            onClick={() => setView("chooser")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to options
          </button>
          {cards.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No cards have been registered for this booking yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {card.card_name}{" "}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          card.card_type === "guest"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {card.card_type}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Room: {card.rooms.room_number} | Number:{" "}
                      <span className="font-mono">{card.card_number}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setCardToEdit(card)} // Set the card to be edited
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Edit className="w-5 h-5 text-yellow-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete All Guest Cards
            </button>
          </div>

          {cards.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No cards have been registered for this booking yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {card.card_name}{" "}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          card.card_type === "guest"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {card.card_type}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Room: {card.rooms.room_number} | Number:{" "}
                      <span className="font-mono">{card.card_number}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
  };

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
