import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import axios from "axios";
import { format } from "date-fns";
import { API_BASE_URL } from "../../../../services/api";

// Helper to convert timestamp to 'yyyy-MM-ddThh:mm' format for input fields
const formatTimestampForInput = (timestamp) => {
  if (!timestamp || timestamp === 0) return "";
  return format(new Date(timestamp), "yyyy-MM-dd'T'HH:mm");
};

const EditCardModal = ({ isOpen, onClose, onSuccess, card }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (card) {
      setStartDate(formatTimestampForInput(card.startDate));
      setEndDate(formatTimestampForInput(card.endDate));
    }
  }, [card]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() : 0;

    try {
      const payload = { startDate: startTimestamp, endDate: endTimestamp };
      const response = await axios.put(
        `${API_BASE_URL}/locks/${card.lockId}/cards/${card.cardId}`,
        payload
      );

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || "An API error occurred.");
      }

      onSuccess({ ...card, ...payload });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to update card validity."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!card) return null;

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
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Validity for "{card.cardName}"
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Card Number:{" "}
                    <span className="font-mono">{card.cardNumber}</span>
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="edit-startDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Valid From (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        id="edit-startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-endDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Valid Until (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        id="edit-endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave dates blank to grant permanent access.
                  </p>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
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

export default EditCardModal;
