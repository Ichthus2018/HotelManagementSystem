// src/routes/AdminRoutes.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/ui/common/loader";

const AdminRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  // If user is logged in AND is an admin, render the requested admin page.
  // Otherwise, redirect them to the home page.
  return user && user.admin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoutes;
