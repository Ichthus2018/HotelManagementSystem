// src/layouts/PopoverMenuItem.jsx
import { NavLink } from "react-router-dom";

const PopoverMenuItem = ({ to, icon, label, close }) => (
  <NavLink
    to={to}
    onClick={close} // Close popover on click
    className={({ isActive }) =>
      `flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-200 ${
        isActive
          ? "bg-blue-50 text-blue-600 font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }`
    }
  >
    <div className="mr-3 text-gray-400">{icon}</div>
    {label}
  </NavLink>
);

export default PopoverMenuItem;
