// src/routes/AdminRoutes.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../hooks/useUser"; // <-- CHANGED
import Loader from "../components/ui/common/Loader";

const AdminRoutes = () => {
  const { user, isLoading } = useUser(); // <-- CHANGED

  if (isLoading) {
    return <Loader />;
  }

  // If fetching is done, and we have a user who is an admin, show the content.
  // Otherwise, redirect. The `session` check is implicitly handled by `useUser`.
  return user && user.admin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoutes;
