// src/components/Admin/Modals/InventoryActions/StockActionModal.jsx

import React, { useState, Fragment, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";

const StockActionModal = ({ isOpen, onClose, onSuccess, item, actionType }) => {
  console.log(item);

  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [stockPool, setStockPool] = useState("stock_available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form state when the modal opens or action changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason("");
      setError("");
      // Sensible default for the write-off stock pool
      if (actionType === "WRITE_OFF") {
        if (item.lifecycle_name === "Cyclical") {
          setStockPool("stock_dirty");
        } else if (item.lifecycle_name === "Tracked Asset") {
          setStockPool("stock_in_use");
        } else {
          setStockPool("stock_available");
        }
      }
    }
  }, [isOpen, actionType, item]);

  const getModalInfo = () => {
    const info = {
      CONSUME: { title: "Use Stock", buttonText: "Confirm Usage" },
      CONSUME_BUNDLE: {
        title: "Bundle Consumption",
        buttonText: "Confirm Usage",
      },
      MOVE_TO_DIRTY: { title: "Mark as Dirty", buttonText: "Mark Dirty" },
      MOVE_TO_LAUNDRY: { title: "Send to Laundry", buttonText: "Send" },
      RETURN_FROM_LAUNDRY: {
        title: "Receive from Laundry",
        buttonText: "Receive",
      },
      WRITE_OFF: { title: "Write-off Stock", buttonText: "Confirm Write-off" },
      DEPLOY_ASSET: { title: "Deploy Asset", buttonText: "Deploy" },
      RETURN_TO_STORAGE: { title: "Return to Storage", buttonText: "Return" },
      SEND_FOR_MAINTENANCE: {
        title: "Send for Maintenance",
        buttonText: "Send",
      },
    };
    return (
      info[actionType] || { title: "Perform Action", buttonText: "Confirm" }
    );
  };

  // src/components/Admin/Modals/InventoryActions/StockActionModal.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (quantity <= 0) {
      setError("Quantity must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    let rpcName = "";
    let rpcParams = {};

    // ... (the switch statement remains the same)
    switch (actionType) {
      case "CONSUME_BUNDLE":
        rpcName = "consume_bundle";
        rpcParams = {
          p_bundle_item_id: item.id,
          p_quantity_of_bundles_to_use: quantity,
        };
        break;
      case "CONSUME":
        rpcName = "consume_stock";
        rpcParams = {
          p_item_id: item.id,
          p_quantity_to_use: quantity,
          p_usage_type: reason || "General Use",
          p_notes: "",
        };
        break;
      case "MOVE_TO_DIRTY":
        rpcName = "move_stock_to_dirty";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      case "MOVE_TO_LAUNDRY":
        rpcName = "move_stock_to_laundry";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      case "RETURN_FROM_LAUNDRY":
        rpcName = "return_stock_from_laundry";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      case "WRITE_OFF":
        if (!reason.trim()) {
          setError("A reason is required for writing off stock.");
          setIsSubmitting(false);
          return;
        }
        rpcName = "write_off_stock";
        rpcParams = {
          p_item_id: item.id,
          p_quantity: quantity,
          p_stock_type_to_decrement: stockPool,
          p_reason: reason,
        };
        break;
      case "DEPLOY_ASSET":
        rpcName = "move_stock_to_in_use";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      case "RETURN_TO_STORAGE":
        rpcName = "return_stock_from_in_use";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      case "SEND_FOR_MAINTENANCE":
        rpcName = "move_stock_to_maintenance";
        rpcParams = { p_item_id: item.id, p_quantity: quantity };
        break;
      default:
        setError("Invalid action type.");
        setIsSubmitting(false);
        return;
    }

    try {
      const { error: rpcError } = await supabase.rpc(rpcName, rpcParams);
      if (rpcError) throw rpcError;
      onSuccess(); // This will close the modal and refresh the data on the main page
    } catch (err) {
      console.error(`Error performing action ${actionType}:`, err);

      const fullErrorString = `${err.message || ""} ${err.details || ""} ${
        err.hint || ""
      }`.toLowerCase();

      let friendlyError =
        "An unexpected error occurred. Please check the details and try again.";

      // UPDATED CHECKS: Using "not enough" instead of "insufficient"
      if (fullErrorString.includes("insufficient stock for component")) {
        // This one might still be "insufficient" if it's a different function, let's keep it.
        friendlyError = err.message;
      } else if (fullErrorString.includes("not enough dirty stock")) {
        friendlyError =
          "The quantity exceeds the number of dirty items available to send to laundry.";
      } else if (fullErrorString.includes("not enough available stock")) {
        friendlyError = "The quantity exceeds the available (clean/new) stock.";
      } else if (fullErrorString.includes("not enough stock in laundry")) {
        friendlyError =
          "The quantity exceeds the number of items currently in laundry.";
      } else if (fullErrorString.includes("not enough stock in use")) {
        friendlyError =
          "The quantity exceeds the number of assets currently deployed or in use.";
      } else if (
        fullErrorString.includes("not enough stock under maintenance")
      ) {
        friendlyError =
          "The quantity exceeds the number of assets currently under maintenance.";
      } else if (fullErrorString.includes("not enough stock")) {
        friendlyError =
          "The quantity specified exceeds the available stock for this action.";
      }

      setError(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => (
    <>
      {actionType === "CONSUME_BUNDLE" && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p>This action will process components based on their lifecycle:</p>
          <ul className="list-disc pl-5 mt-2 font-medium">
            <li>
              <span className="font-bold text-red-700">Consumables</span> (e.g.,
              soap) will be removed from stock.
            </li>
            <li>
              <span className="font-bold text-yellow-700">Cyclical items</span>{" "}
              (e.g., towels) will be marked as Dirty.
            </li>
            <li>
              <span className="font-bold text-indigo-700">Tracked Assets</span>{" "}
              will be marked as In Use.
            </li>
          </ul>
          <p className="mt-2 font-semibold">Components in this kit:</p>
          <ul className="list-disc pl-5 mt-1">
            {item.components?.map((c) => (
              <li key={c.component_id}>
                {c.component_name} (Requires: {c.quantity_required})
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {actionType === "CONSUME_BUNDLE" ? "Number of Kits*" : "Quantity*"}
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          required
        />
      </div>

      {actionType === "WRITE_OFF" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              From Which Stock Pool?*
            </label>
            <select
              value={stockPool}
              onChange={(e) => setStockPool(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="stock_available">Available (Clean/New)</option>
              {item.lifecycle_name === "Cyclical" && (
                <option value="stock_dirty">Dirty</option>
              )}
              {item.lifecycle_name === "Cyclical" && (
                <option value="stock_in_laundry">In Laundry</option>
              )}
              {item.lifecycle_name === "Tracked Asset" && (
                <option value="stock_in_use">In Use (Deployed)</option>
              )}
              {item.lifecycle_name === "Tracked Asset" && (
                <option value="stock_under_maintenance">
                  Under Maintenance
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for Write-off*
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Unrepairable, Damaged, Stolen"
              required
            />
          </div>
        </>
      )}

      {actionType === "CONSUME" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Usage Location / Notes (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Guest Room 101, Restaurant Bar"
          />
        </div>
      )}
    </>
  );

  const { title, buttonText } = getModalInfo();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  onClick={onClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  {title}
                </DialogTitle>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-bold text-gray-800">
                    {item?.item_name}
                  </p>
                  <p className="text-xs text-gray-500">{item?.item_code}</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {renderFormFields()}
                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
                    >
                      {isSubmitting ? "Processing..." : buttonText}
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

export default StockActionModal;
