import { useState, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import axios from "axios";
import { IoIosCloseCircleOutline } from "react-icons/io"; // Import the icon
import { API_BASE_URL } from "../../../../services/api";

const AddCardModal = ({ isOpen, onClose, onSuccess, lockId, lockAlias }) => {
  // Form state, now including cardNumber
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Standard control state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCardName("");
    setCardNumber("");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardName) {
      setError("Card Name and Card Number are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    // TTLock API uses milliseconds since epoch. 0 means permanent.
    const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() : 0;

    try {
      // The payload now includes the raw cardNumber from the form
      const payload = {
        cardNumber,
        cardName,
        startDate: startTimestamp,
        endDate: endTimestamp,
      };

      // Call the updated backend endpoint
      const response = await axios.post(
        `${API_BASE_URL}/locks/${lockId}/cards`,
        payload
      );

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || "An API error occurred.");
      }

      // The API response for `addForReversedCardNumber` helpfully returns the
      // final, converted card number. We'll use that for the UI update.
      const newCardData = {
        cardId: response.data.cardId,
        cardNumber: response.data.cardNumber, // The CORRECT, converted number
        cardName,
        startDate: startTimestamp,
        endDate: endTimestamp,
        lockId,
        lockAlias,
      };

      onSuccess(newCardData);
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to add card."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Added 'relative' for positioning the close button */}
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* --- NEW Close Button --- */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>

                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Add New IC Card to "{lockAlias}"
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* --- FORM FIELDS --- */}
                  <div>
                    <label
                      htmlFor="cardName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Card Holder Name*
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      // --- UPDATED Styles ---
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cardNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Card Number (from E3 Reader)*
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      // --- UPDATED Styles ---
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., 2942187"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Place the card on your reader and type the number here.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Valid From (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        // --- UPDATED Styles ---
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Valid Until (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        // --- UPDATED Styles ---
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave dates blank for permanent access.
                  </p>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  {/* --- UPDATED ACTION BUTTONS --- */}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Adding..." : "Add Card"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddCardModal;
