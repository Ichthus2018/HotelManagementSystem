import { useState, Fragment } from "react";
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
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaCheckCircle,
  FaRegCircle,
  FaCrown,
} from "react-icons/fa";

// Helper component for password validation checklist item
const ValidationItem = ({ isValid, text }) => (
  <li
    className={`flex items-center text-sm ${
      isValid ? "text-green-600" : "text-gray-500"
    }`}
  >
    {isValid ? (
      <FaCheckCircle className="mr-2" />
    ) : (
      <FaRegCircle className="mr-2" />
    )}
    {text}
  </li>
);

const AddPersonnelModal = ({ isOpen, onClose, onSuccess }) => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin toggle

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // New state for password visibility and validation
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  // --- FUNCTIONS ---

  // Resets all state when the modal is closed
  const handleClose = () => {
    setEmail("");
    setPassword("");
    setRole("staff");
    setIsAdmin(false); // Reset admin toggle
    setError("");
    setIsSubmitting(false);
    setShowPassword(false);
    setIsPasswordFocused(false);
    setPasswordValidation({
      minLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
    });
    onClose();
  };

  // Real-time password validation as the user types
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    setPasswordValidation({
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    });
  };

  // Handle role change - if admin is selected, automatically check admin toggle
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);

    // If user selects "admin" role, automatically set admin to true
    if (newRole === "admin") {
      setIsAdmin(true);
    }
  };

  // Handle admin toggle - if unchecking admin, check if role is admin and warn
  const handleAdminToggle = (newAdminStatus) => {
    if (!newAdminStatus && role === "admin") {
      // Warn user that unchecking admin for an admin role might not make sense
      if (
        window.confirm(
          "This user has an 'admin' role. Are you sure you want to remove admin privileges?"
        )
      ) {
        setIsAdmin(newAdminStatus);
      }
    } else {
      setIsAdmin(newAdminStatus);
    }
  };

  // Checks if all password requirements are met
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Handles the form submission
  // Inside your AddPersonnelModal component

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet all the requirements.");
      return;
    }

    setIsSubmitting(true);

    // --- START OF THE NEW LOGIC ---

    let adminSession = null;

    try {
      // Step 1: Get and save the current admin's session.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) throw new Error("Admin is not logged in.");
      adminSession = data.session;

      // Step 2: Sign up the new user.
      // This will temporarily replace the current session with the new user's session.
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            admin: isAdmin,
          },
        },
      });

      if (signUpError) throw signUpError;

      // If successful, notify the parent and close the modal
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding personnel:", err);
      setError(err.message || "Failed to add personnel.");
    } finally {
      // Step 3: ALWAYS restore the admin's session, even if an error occurred.
      if (adminSession) {
        const { error: setSessionError } = await supabase.auth.setSession(
          adminSession
        );
        if (setSessionError) {
          console.error(
            "Critical: Failed to restore admin session!",
            setSessionError
          );
          setError(
            "User created, but failed to restore your session. Please refresh the page."
          );
        }
      }
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
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
                {/* Close Button */}
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
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Add New Personnel
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Email Input */}
                  <div className="relative group">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email Address*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaEnvelope className="h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all duration-200 text-sm"
                        placeholder="e.g., user@example.com"
                      />
                    </div>
                  </div>

                  {/* Password Input with Visibility Toggle */}
                  <div className="relative group">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Password*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaLock className="h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => setIsPasswordFocused(true)}
                        required
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all duration-200 text-sm"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-orange-600"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-4 w-4" />
                        ) : (
                          <FaEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Validation Checklist */}
                  {isPasswordFocused && (
                    <div className="mt-2 pl-1">
                      <ul className="space-y-1">
                        <ValidationItem
                          isValid={passwordValidation.minLength}
                          text="At least 8 characters long"
                        />
                        <ValidationItem
                          isValid={passwordValidation.hasUpper}
                          text="Contains an uppercase letter"
                        />
                        <ValidationItem
                          isValid={passwordValidation.hasLower}
                          text="Contains a lowercase letter"
                        />
                        <ValidationItem
                          isValid={passwordValidation.hasNumber}
                          text="Contains a number"
                        />
                      </ul>
                    </div>
                  )}

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Role*
                    </label>
                    <select
                      value={role}
                      onChange={handleRoleChange}
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all duration-200 text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  {/* Admin Toggle Button */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FaCrown className="h-5 w-5 text-yellow-500 mr-3" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          Administrator Access
                        </label>
                        <p className="text-xs text-gray-500">
                          {isAdmin
                            ? "This user will have full administrative privileges"
                            : "Standard user permissions"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdminToggle(!isAdmin)}
                      disabled={isSubmitting}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        isAdmin ? "bg-orange-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAdmin ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Helper text showing the relationship between role and admin */}
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <strong>Note:</strong>
                    {isAdmin && role === "admin"
                      ? " ✓ This user has both 'Admin' role and administrator privileges"
                      : isAdmin && role !== "admin"
                      ? ` ⚠ This user has administrator privileges but a '${role}' role`
                      : !isAdmin && role === "admin"
                      ? " ⚠ This user has 'Admin' role but no administrator privileges"
                      : " Standard user permissions"}
                  </div>

                  {/* Error Message Display */}
                  {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isPasswordValid}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Adding..." : "Add Personnel"}
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

export default AddPersonnelModal;
