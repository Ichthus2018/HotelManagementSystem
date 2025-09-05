// src/components/auth/PasswordStrengthIndicator.jsx

import { FaCheck, FaTimes } from "react-icons/fa";

const PasswordRequirement = ({ met, text }) => (
  <li
    className={`flex items-center text-sm transition-colors ${
      met ? "text-green-600" : "text-gray-500"
    }`}
  >
    {met ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
    {text}
  </li>
);

const PasswordStrengthIndicator = ({ password }) => {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <ul className="space-y-1 mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
      <PasswordRequirement met={hasLength} text="At least 8 characters" />
      <PasswordRequirement met={hasUpper} text="An uppercase letter" />
      <PasswordRequirement met={hasLower} text="A lowercase letter" />
      <PasswordRequirement met={hasNumber} text="At least one number" />
      <PasswordRequirement
        met={hasSpecial}
        text="At least one special character"
      />
    </ul>
  );
};

export default PasswordStrengthIndicator;
