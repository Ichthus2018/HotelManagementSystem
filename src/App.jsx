import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Loader from "./components/ui/common/loader";

// Layouts
import AdminLayout from "./components/Admin/layout/AdminLayout";
import CustomerLayout from "./components/Customer/layout/CustomerLayout";

// Route Guards
import AdminRoutes from "./routes/AdminRoutes";
import ProtectedRoute from "./routes/ProtectedRoute";

// Pages
import Login from "./pages/auth/Login";
import HomePage from "./pages/customer/HomePage";
import BookingPage from "./pages/customer/BookingPage";
import LandingPage from "./pages/admin/LandingPage";
import Register from "./pages/auth/Register";
import RoomTypes from "./pages/admin/roomTypes";
import RoomNumbers from "./pages/admin/roomNumbers";
import RoomLocations from "./pages/admin/roomlocations";
import CardKeys from "./pages/admin/cardKeys";
import Bookings from "./pages/admin/bookings";
import RoomStatus from "./pages/admin/RoomStatus";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />; // Use your Loader component here
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* === Admin Routes === */}
        <Route element={<AdminLayout />}>
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<LandingPage />} />
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/roomTypes" element={<RoomTypes />} />
            <Route path="/admin/roomNumbers" element={<RoomNumbers />} />
            <Route path="/admin/roomStatus" element={<RoomStatus />} />
            <Route path="/admin/roomLocations" element={<RoomLocations />} />
            <Route path="/admin/cardKeys" element={<CardKeys />} />
            <Route path="/admin/bookings" element={<Bookings />} />
          </Route>
        </Route>

        {/* === Customer & Public Routes === */}
        <Route element={<CustomerLayout />}>
          <Route
            path="/"
            element={
              user?.admin ? <Navigate to="/admin" replace /> : <HomePage />
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route path="/my-bookings" element={<BookingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
