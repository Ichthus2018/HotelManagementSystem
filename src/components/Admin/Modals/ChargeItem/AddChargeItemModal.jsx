// src/components/.../AddChargeItemModal.js

import { useState, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";

const AddChargeItemModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // NEW: State for the charge type
  const [chargeType, setChargeType] = useState("fixed"); // 'fixed' or 'percentage'
  // RENAMED: from price to value for clarity
  const [value, setValue] = useState("");
  const [isVatable, setIsVatable] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setName("");
    setDescription("");
    setChargeType("fixed"); // Reset on close
    setValue("");
    setIsVatable(true);
    setIsDefault(false);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Charge item name is required.");
      return;
    }
    const numericValue = parseFloat(value);
    if (!value || numericValue < 0) {
      setError("A valid, non-negative value is required.");
      return;
    }
    // NEW: Validation for percentage
    if (chargeType === "percentage" && numericValue > 100) {
      setError("Percentage cannot exceed 100.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("charge_items")
        .insert([
          {
            name,
            description,
            charge_type: chargeType, // Send the charge type
            value: numericValue, // Send the value
            is_vatable: isVatable,
            is_default: isDefault,
          },
        ]);

      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding charge item:", err);
      setError(err.message || "Failed to add charge item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                {/* ... (Close Button and DialogTitle are unchanged) ... */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* ... (Name and Description inputs are unchanged) ... */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* ===== NEW DYNAMIC PRICE/PERCENTAGE SECTION ===== */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="chargeType"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Charge Type*
                      </label>
                      <select
                        id="chargeType"
                        value={chargeType}
                        onChange={(e) => setChargeType(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="value"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {chargeType === "fixed"
                          ? "Price (₱)*"
                          : "Percentage (%)*"}
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          id="value"
                          min="0"
                          step={chargeType === "fixed" ? "0.01" : "1"}
                          max={chargeType === "percentage" ? "100" : undefined}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  {/* ===== END NEW SECTION ===== */}

                  {/* ... (Checkboxes, error message, and submit button are unchanged) ... */}
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isVatable"
                        checked={isVatable}
                        onChange={(e) => setIsVatable(e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isVatable"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        VAT Applicable
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isDefault"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Default Item
                      </label>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Adding..." : "Add Charge Item"}
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

export default AddChargeItemModal;
