// src/layouts/AdminLayout.jsx
import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import supabase from "../../../services/supabaseClient";
import LogoutModal from "./LogoutModal";
import Sidebar from "./Sidebar"; // Import the new Sidebar component

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleLogoutClick = (closePopover) => {
    if (closePopover) closePopover();
    setIsLogoutModalOpen(true);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen text-gray-800 overflow-hidden font-sans">
      {/* ====== SIDEBAR ====== */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
        user={user}
        handleLogoutClick={handleLogoutClick}
      />

      {/* ====== MAIN CONTENT AREA ====== */}
      <main className="flex-1 overflow-y-auto">
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white text-gray-600 rounded-lg shadow-md border border-gray-200"
          aria-label="Open sidebar"
        >
          <FaBars size={20} />
        </button>

        {/* Content Rendered Here */}
        <Outlet />
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        ></div>
      )}

      {/* Render the Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
