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

const EditPersonnelModal = ({ isOpen, onClose, onSuccess, personnel }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [admin, setAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate form fields when the personnel data is passed in
  useEffect(() => {
    if (personnel) {
      setEmail(personnel.auth_users?.email || personnel.email || "");
      setRole(personnel.role || "staff");
      setAdmin(personnel.admin || false);
      setError(""); // Clear previous errors
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
      // Update the email in auth.users if it's different
      if (email !== (personnel.auth_users?.email || personnel.email)) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          personnel.id,
          { email: email }
        );
        if (emailError) throw emailError;
      }

      // Update the role and admin status in public.users
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: role,
          admin: admin || role === "admin", // Ensure admin is true if role is admin
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

  // Handle role change - automatically set admin status if role is admin
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
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Personnel
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email*
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role*
                    </label>
                    <select
                      id="edit-role"
                      value={role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-admin"
                      checked={admin}
                      onChange={(e) => setAdmin(e.target.checked)}
                      disabled={role === "admin"} // Disable if role is admin since it's automatically true
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="edit-admin"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Administrator privileges
                      {role === "admin" && (
                        <span className="text-xs text-gray-500 ml-1">
                          (automatically enabled for Admin role)
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> To change the user's password, use
                      the "Change Password" option from the personnel list.
                    </p>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
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
