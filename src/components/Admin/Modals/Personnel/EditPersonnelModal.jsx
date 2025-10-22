import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";

// --- ICONS ---
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaCrown } from "react-icons/fa";

const EditPersonnelModal = ({ isOpen, onClose, onSuccess, personnel }) => {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(""); // Store the role ID
  const [roles, setRoles] = useState([]); // Store available roles
  const [admin, setAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch available roles from the database when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchRoles = async () => {
        const { data, error } = await supabase
          .from("sidebar_permissions")
          .select("id, role_name")
          .order("role_name", { ascending: true });
        if (error) {
          console.error("Error fetching roles:", error);
          setError("Could not load roles from the database.");
        } else {
          setRoles(data);
        }
      };
      fetchRoles();
    }
  }, [isOpen]);

  // Populate form with existing personnel data when it changes
  useEffect(() => {
    if (personnel) {
      setEmail(personnel.email || "");
      setRoleId(personnel.role_id || "");
      setAdmin(personnel.admin || false);
      setError("");
    }
  }, [personnel, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // Update the user's role_id and admin status in the public.users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role_id: roleId ? parseInt(roleId, 10) : null,
          admin: admin,
        })
        .eq("id", personnel.id);

      if (updateError) throw updateError;
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating personnel:", err);
      setError(err.message || "Failed to update personnel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (e) => {
    const selectedRoleId = e.target.value;
    setRoleId(selectedRoleId);

    // Automatically grant and disable the toggle for system access if the selected role is "admin"
    const selectedRole = roles.find((r) => r.id.toString() === selectedRoleId);
    if (selectedRole && selectedRole.role_name.toLowerCase() === "admin") {
      setAdmin(true);
    }
  };

  if (!personnel) return null;

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
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all">
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
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Edit Personnel
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 focus:outline-none text-sm cursor-not-allowed"
                    />
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Role Name*
                    </label>
                    <select
                      value={roleId}
                      onChange={handleRoleChange}
                      disabled={isSubmitting || roles.length === 0}
                      className="w-full py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    >
                      <option value="" disabled>
                        Select a role...
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Access Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FaCrown className="h-5 w-5 text-yellow-500 mr-3" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          System Access
                        </label>
                        <p className="text-xs">
                          {admin ? (
                            <span className="font-bold text-green-600">
                              Access Enabled
                            </span>
                          ) : (
                            <span className="font-bold text-red-600">
                              Access Disabled
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdmin(!admin)}
                      disabled={
                        isSubmitting ||
                        roles
                          .find((r) => r.id.toString() === roleId)
                          ?.role_name.toLowerCase() === "admin"
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        admin ? "bg-blue-600" : "bg-gray-300"
                      } ${
                        roles
                          .find((r) => r.id.toString() === roleId)
                          ?.role_name.toLowerCase() === "admin"
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          admin ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  )}

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
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

export default EditPersonnelModal;
