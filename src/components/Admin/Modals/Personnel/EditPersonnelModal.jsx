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
  const [role, setRole] = useState("staff");
  const [admin, setAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (personnel) {
      setEmail(personnel.auth_users?.email || personnel.email || "");
      setRole(personnel.role || "staff");
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
      if (email !== (personnel.auth_users?.email || personnel.email)) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          personnel.id,
          { email: email }
        );
        if (emailError) throw emailError;
      }
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: role,
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

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "admin") {
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
                      Email Address*
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Role*
                    </label>
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* --- MODIFIED SECTION START --- */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FaCrown className="h-5 w-5 text-yellow-500 mr-3" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          Account Access
                        </label>
                        <p className="text-xs">
                          {admin ? (
                            <span className="font-bold text-green-600">
                              Has system access
                            </span>
                          ) : (
                            <span className="font-bold text-red-600">
                              Access disabled
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdmin(!admin)}
                      disabled={isSubmitting || role === "admin"}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        admin ? "bg-blue-600" : "bg-gray-300"
                      } ${role === "admin" ? "cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          admin ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  {/* --- MODIFIED SECTION END --- */}

                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <strong>Note:</strong>{" "}
                    {admin && role === "admin"
                      ? "✓ Admin user — has full access."
                      : admin && role !== "admin"
                      ? `⚠ Access ON but user role is '${role}'.`
                      : !admin && role === "admin"
                      ? "⚠ Admin role but access is OFF. (Access is required for Admin role)"
                      : "Regular user — access is OFF."}
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
