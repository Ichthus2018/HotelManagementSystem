// src/components/Admin/Modals/Amenities/EditAmenityModal.jsx

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

const EditAmenityModal = ({ isOpen, onClose, onSuccess, item }) => {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setItemCode(item.item_code || "");
      setItemName(item.item_name || "");
      setStatus(item.status !== false);
      setError("");
    }
  }, [item, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) {
      setError("Item code and name are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("items") // Changed table name
        .update({
          item_code: itemCode,
          item_name: itemName,
          status,
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err.message || "Failed to update item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

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
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Item
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="edit-itemCode"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Item Code*
                    </label>
                    <input
                      type="text"
                      id="edit-itemCode"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-itemName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Item Name*
                    </label>
                    <input
                      type="text"
                      id="edit-itemName"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Active Status
                      </span>
                    </label>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
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

export default EditAmenityModal;
