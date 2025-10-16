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
import ParentCombobox from "../../../ui/common/ParentCombobox";

const AddReceiveItemsModal = ({ isOpen, onClose, onSuccess }) => {
  // Form State
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [receivedAt, setReceivedAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  ); // Default to now

  // Data & Control State
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch Raw Materials when modal opens
  useEffect(() => {
    const fetchRawMaterials = async () => {
      if (!isOpen) return;
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, item_name, item_code, batch")
          .eq("item_class", "Raw Material")
          .eq("status", true);

        if (error) throw error;
        setRawMaterials(data || []);
      } catch (err) {
        console.error("Failed to fetch raw materials:", err);
        setError("Could not load items. Please try again.");
      }
    };

    fetchRawMaterials();
  }, [isOpen]);

  // Reset form when a new item is selected
  useEffect(() => {
    setQuantity("");
    setBatchNumber("");
    setExpiryDate("");
    setError("");
  }, [selectedItem]);

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setBatchNumber("");
    setExpiryDate("");
    setReceivedAt(new Date().toISOString().slice(0, 16));
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // --- Validation ---
    if (!selectedItem) {
      setError("You must select an item.");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (selectedItem.batch && !batchNumber.trim()) {
      setError("Batch number is required for this item.");
      return;
    }
    if (selectedItem.batch && !expiryDate) {
      setError("Expiry date is required for this item.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: rpcError } = await supabase.rpc("receive_stock", {
        p_item_id: selectedItem.id,
        p_quantity: parseFloat(quantity),
        p_received_at: receivedAt,
        // Conditionally pass batch info or null
        p_batch_number: selectedItem.batch ? batchNumber : null,
        p_expiry_date: selectedItem.batch ? expiryDate : null,
      });

      if (rpcError) throw rpcError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error receiving stock:", err);
      setError(err.message || "Failed to receive stock.");
    } finally {
      setIsSubmitting(false);
    }
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
                  Receive New Stock
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <ParentCombobox
                    label="Select Item*"
                    data={rawMaterials}
                    selected={selectedItem}
                    setSelected={setSelectedItem}
                    nameKey="item_name"
                    codeKey="item_code"
                  />

                  {selectedItem && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Quantity*
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* --- Conditional Fields for Batch Items --- */}
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
                              className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Expiry Date*
                            </label>
                            <input
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedItem}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                      {isSubmitting ? "Receiving..." : "Receive Stock"}
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

export default AddReceiveItemsModal;
