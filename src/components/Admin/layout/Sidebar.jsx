// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import supabase from "../../../services/supabaseClient";

const Sidebar = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-gray-800 text-white">
      <h2 className="text-3xl font-semibold">Admin Panel</h2>
      <nav className="flex flex-col mt-10">
        <NavLink
          to="/admin/dashboard"
          className="py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/users"
          className="py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
        >
          Users
        </NavLink>
        <NavLink
          to="/admin/bookings"
          className="py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
        >
          Bookings
        </NavLink>
        <button
          onClick={handleLogout}
          className="mt-auto py-2.5 px-4 rounded transition duration-200 bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
