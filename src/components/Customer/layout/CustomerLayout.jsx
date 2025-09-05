// src/layouts/CustomerLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; // Make sure this path is correct

const CustomerLayout = () => {
  return (
    // Add a subtle background color for the entire page
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
