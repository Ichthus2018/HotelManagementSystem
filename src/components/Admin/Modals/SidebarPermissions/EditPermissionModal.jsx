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
import { sidebarSections } from "../../../../constants/sidebarRoutes";

const EditPermissionModal = ({ isOpen, onClose, onSuccess, permission }) => {
  const [roleName, setRoleName] = useState("");
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (permission) {
      setRoleName(permission.role_name || "");
      setSelectedRoutes(permission.allowed_routes || []);
      setError("");
    }
  }, [permission, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedRoutes((prev) => [...prev, value]);
    } else {
      setSelectedRoutes((prev) => prev.filter((route) => route !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError("Role name is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("sidebar_permissions")
        .update({
          role_name: roleName,
          allowed_routes: selectedRoutes,
        })
        .eq("id", permission.id);

      if (updateError) throw updateError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating permission:", err);
      setError(
        err.message.includes("duplicate key")
          ? "This role name already exists."
          : err.message || "Failed to update permission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission) return null;

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
              <DialogPanel className="relative w-full max-w-2xl lg:max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/*  ^^^ CHANGE 1 HERE ^^^ */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Role Permission
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label
                      htmlFor="edit-roleName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role Name*
                    </label>
                    <input
                      type="text"
                      id="edit-roleName"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Allowed Sidebar Routes*
                    </label>
                    <div className="max-h-[50vh] overflow-y-auto rounded-lg border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                      {/*  ^^^ CHANGE 2 HERE ^^^ (also adjusted gaps and max-height) */}
                      {Object.entries(sidebarSections).map(
                        ([sectionTitle, routes]) => (
                          <div
                            key={sectionTitle}
                            className="break-inside-avoid"
                          >
                            <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                              {sectionTitle}
                            </h4>
                            <div className="space-y-2 pt-1">
                              {routes.map((route) => (
                                <label
                                  key={route.path}
                                  className="flex items-center"
                                >
                                  <input
                                    type="checkbox"
                                    value={route.path}
                                    checked={selectedRoutes.includes(
                                      route.path
                                    )}
                                    onChange={handleCheckboxChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    {route.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
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

export default EditPermissionModal;
