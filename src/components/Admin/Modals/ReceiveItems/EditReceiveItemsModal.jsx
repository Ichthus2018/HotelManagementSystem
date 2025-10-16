import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";

// Helper to format dates correctly for inputs
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const formatDate = (isoString) => {
  if (!isoString) return "";
  return isoString.split("T")[0];
};

const EditReceiveItemsModal = ({ isOpen, onClose, onSuccess, batch }) => {
  // Form State
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [selectedItem, setSelectedItem] = useState(null); // The associated item

  // Control State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-populate form when modal opens with a batch
  useEffect(() => {
    if (isOpen && batch) {
      setSelectedItem(batch.items || null); // The joined item data
      setQuantity(batch.quantity || "");
      setBatchNumber(batch.batch_number || "");
      setExpiryDate(formatDate(batch.expiry_date));
      setReceivedAt(formatDateTimeLocal(batch.received_at));
      setError("");
    }
  }, [isOpen, batch]);

  const handleClose = () => {
    onClose();
    // No need to reset form here as useEffect will repopulate on next open
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (selectedItem?.batch && !batchNumber.trim()) {
      setError("Batch number is required for this item.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToUpdate = {
        quantity: parseFloat(quantity),
        received_at: receivedAt,
        batch_number: selectedItem?.batch ? batchNumber : null,
        expiry_date: selectedItem?.batch ? expiryDate : null,
      };

      const { error: updateError } = await supabase
        .from("inventory_batches")
        .update(dataToUpdate)
        .eq("id", batch.id);

      if (updateError) throw updateError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating batch:", err);
      setError(err.message || "Failed to update batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!batch || !selectedItem) return null;

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
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Stock Receipt
                </DialogTitle>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-bold text-gray-800">
                    {selectedItem.item_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedItem.item_code}
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity*
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                      required
                      min="0.01"
                      step="any"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Received Date & Time*
                    </label>
                    <input
                      type="datetime-local"
                      value={receivedAt}
                      onChange={(e) => setReceivedAt(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                      required
                    />
                  </div>

                  {selectedItem.batch && (
                    <div className="space-y-4 pt-2 border-t mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Batch Number*
                        </label>
                        <input
                          type="text"
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default EditReceiveItemsModal;
