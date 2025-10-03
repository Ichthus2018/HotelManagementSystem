// File: src/components/Admin/Gateway/AddGatewayModal.jsx

import { useState, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient"; // Adjust path as needed

const AddGatewayModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [ttlockGatewayId, setTtlockGatewayId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setTtlockGatewayId("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ttlockGatewayId.trim()) {
      setError("TTLock Gateway ID is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("gateways").insert([
        {
          ttlock_gateway_id: parseInt(ttlockGatewayId, 10),
          name: name || null,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      resetForm();
    } catch (err) {
      console.error("Error adding gateway:", err);
      // More user-friendly error for unique constraint violation
      if (err.message?.includes("duplicate key value")) {
        setError("A gateway with this TTLock ID already exists.");
      } else {
        setError(err.message || "Failed to add gateway.");
      }
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
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Add New Gateway
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="gatewayName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gateway Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="gatewayName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      placeholder="e.g., Main Entrance Gateway"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ttlockGatewayId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gateway ID*
                    </label>
                    <input
                      type="number"
                      id="ttlockGatewayId"
                      value={ttlockGatewayId}
                      onChange={(e) => setTtlockGatewayId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      required
                      placeholder="The numeric ID from the TTLock API"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Adding..." : "Add Gateway"}
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

export default AddGatewayModal;
