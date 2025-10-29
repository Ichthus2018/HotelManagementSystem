// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../hooks/useUser"; // <-- CHANGED
import Loader from "../components/ui/common/loader";

const ProtectedRoute = () => {
  const { user, isLoading } = useUser(); // <-- CHANGED

  if (isLoading) {
    return <Loader />;
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
