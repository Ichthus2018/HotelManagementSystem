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
import RoomTypes from "./pages/admin/RoomTypes";
import RoomNumbers from "./pages/admin/RoomNumbers";
import RoomLocations from "./pages/admin/roomlocations";
import CardKeys from "./pages/admin/cardKeys";
import Bookings from "./pages/admin/Bookings";
import RoomStatus from "./pages/admin/RoomStatus";
import DoorLocks from "./pages/admin/DoorLocks";
import Gateways from "./pages/admin/Gateways";
import HotelFacilities from "./pages/admin/HotelFacilities";
import Guests from "./pages/admin/Guests";
import ChargeItems from "./pages/admin/ChargeItems";
import HotelInformation from "./pages/admin/HotelInformation";
import Categories1 from "./pages/admin/Categories1";
import Categories2 from "./pages/admin/Categories2";
import Categories3 from "./pages/admin/Categories3";
import Categories4 from "./pages/admin/Categories4";
import Categories5 from "./pages/admin/Categories5";
import ItemType from "./pages/admin/ItemType";
import Items from "./pages/admin/Items";
import Personnel from "./pages/admin/Personnel";
import LockCardManager from "./pages/admin/LockCardManager";
import Dashboard from "./pages/admin/Dashboard";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />; // Use your Loader component here
  }

  return (
    <BrowserRouter basename="/HotelManagementSystem">
      <Routes>
        {/*
          CHANGE 1: The root path "/" is now a conditional redirect.
          - If no user, redirect to "/login". This makes login the default.
          - If user is admin, redirect to "/admin".
          - If user is a customer, redirect to "/home".
        */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.admin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />

        {/*
          CHANGE 2: Handle login/register routes separately.
          - If a user is already logged in, redirect them away from the login page.
        */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" replace />}
        />

        {/* === Admin Routes (No changes needed here) === */}
        <Route element={<AdminLayout />}>
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<LandingPage />} />
            <Route path="/admin/roomTypes" element={<RoomTypes />} />
            <Route
              path="/admin/roomNumbers/:roomTypeId"
              element={<RoomNumbers />}
            />
            <Route
              path="/admin/hotelInformation"
              element={<HotelInformation />}
            />
            <Route path="/admin/chargeItems" element={<ChargeItems />} />
            <Route path="/admin/roomNumbers" element={<RoomNumbers />} />
            <Route path="/admin/roomStatus" element={<RoomStatus />} />
            <Route path="/admin/roomLocations" element={<RoomLocations />} />
            <Route path="/admin/cardKeys" element={<CardKeys />} />
            <Route path="/admin/doorLocks" element={<DoorLocks />} />
            <Route path="/admin/gateways" element={<Gateways />} />
            <Route path="/admin/categories1" element={<Categories1 />} />
            <Route path="/admin/categories2" element={<Categories2 />} />
            <Route path="/admin/categories3" element={<Categories3 />} />
            <Route path="/admin/categories4" element={<Categories4 />} />
            <Route path="/admin/categories5" element={<Categories5 />} />
            <Route path="/admin/itemType" element={<ItemType />} />
            <Route path="/admin/item" element={<Items />} />
            <Route path="/admin/personnel" element={<Personnel />} />
            <Route
              path="/admin/lockCardManager"
              element={<LockCardManager />}
            />
            <Route
              path="/admin/hotelfacilities"
              element={<HotelFacilities />}
            />
            <Route path="/admin/guests" element={<Guests />} />
            <Route path="/admin/bookings" element={<Bookings />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            {/* A catch-all for any other /admin URL to redirect to the admin home */}
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        {/*
          CHANGE 3: Customer routes are now on specific paths like "/home".
          - The CustomerLayout now wraps these specific protected routes.
        */}
        <Route element={<CustomerLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/my-bookings" element={<BookingPage />} />
          </Route>
        </Route>

        {/*
          CHANGE 4: The catch-all route now redirects to the root "/".
          The logic at "/" will then handle sending the user to the correct page.
        */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
