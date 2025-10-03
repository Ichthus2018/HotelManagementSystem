import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

const RenameGatewayModal = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  gateway,
}) => {
  const [newName, setNewName] = useState("");

  // When the modal opens or the gateway changes, pre-fill the input
  useEffect(() => {
    if (gateway) {
      setNewName(gateway.name || "");
    }
  }, [gateway, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && !isProcessing) {
      onConfirm(newName.trim());
    }
  };

  const isSaveDisabled =
    isProcessing || !newName.trim() || newName.trim() === gateway?.name;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <PencilSquareIcon
                className="h-6 w-6 text-blue-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-4 text-left flex-1">
              <Dialog.Title
                as="h3"
                className="text-lg font-semibold leading-6 text-gray-900"
              >
                Rename Gateway
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Enter a new name for "
                  {gateway?.name || `Gateway #${gateway?.id}`}".
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="gatewayName"
                className="block text-sm font-medium text-gray-700"
              >
                New Gateway Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="gatewayName"
                  id="gatewayName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="e.g., Main Entrance Gateway"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaveDisabled}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default RenameGatewayModal;
