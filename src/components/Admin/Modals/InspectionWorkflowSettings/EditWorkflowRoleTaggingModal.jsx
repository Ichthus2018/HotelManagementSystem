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

const EditWorkflowRoleTaggingModal = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  currentPermissionIds = [],
  availablePermissions = [],
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentPermissionIds);
    }
  }, [isOpen, currentPermissionIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // --- THIS IS THE CORRECTED LOGIC ---
      // We map over all available permissions to determine which ones need changes.
      const updatePayloads = availablePermissions
        .map((perm) => {
          const currentRoles = perm.allowed_roles || [];
          const hasRole = currentRoles.includes(role);
          const shouldHaveRole = selectedIds.includes(perm.id);

          // If no change is needed for this permission, return null.
          if (hasRole === shouldHaveRole) {
            return null;
          }

          // If a change is needed, create the updated permission object.
          let updatedRoles;
          if (shouldHaveRole) {
            // Add the role
            updatedRoles = [...currentRoles, role];
          } else {
            // Remove the role
            updatedRoles = currentRoles.filter((r) => r !== role);
          }
          return {
            ...perm,
            allowed_roles: updatedRoles,
          };
        })
        .filter(Boolean); // This removes all the null entries where no change was needed.

      // Only perform the database call if there are actual changes to be made.
      if (updatePayloads.length > 0) {
        console.log("Submitting these payloads:", updatePayloads); // For debugging

        const { error: upsertError } = await supabase
          .from("sidebar_permissions")
          .upsert(updatePayloads);

        if (upsertError) {
          throw upsertError;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating role permissions:", err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectionChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) =>
      parseInt(option.value, 10)
    );
    setSelectedIds(selectedOptions);
  };

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
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Permissions for{" "}
                  <span className="text-blue-600">{role}</span>
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label
                      htmlFor="permissions-select"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Select permissions
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Hold Ctrl (or Cmd on Mac) to select multiple.
                    </p>
                    <select
                      id="permissions-select"
                      multiple
                      value={selectedIds}
                      onChange={handleSelectionChange}
                      className="mt-1 block w-full h-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {availablePermissions.map((perm) => (
                        <option key={perm.id} value={perm.id}>
                          {perm.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
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

export default EditWorkflowRoleTaggingModal;
