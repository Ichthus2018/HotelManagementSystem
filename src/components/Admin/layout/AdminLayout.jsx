import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useUser } from "../../../hooks/useUser";
import { useSession } from "../../../context/SessionContext";
import LogoutModal from "./LogoutModal";
import Sidebar from "./Sidebar";
import Loader from "../../ui/common/loader";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoading, mutate } = useUser(); // <-- Get user data and mutate from SWR
  const { supabase } = useSession(); // <-- Get the supabase client from context

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // No more useEffect to fetch user! SWR handles it all.

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await supabase.auth.signOut();
    // Immediately clear the user data from the SWR cache for a snappy UI update
    mutate(null, false);
    navigate("/login");
  };

  const handleLogoutClick = (closePopover) => {
    if (closePopover) closePopover();
    setIsLogoutModalOpen(true);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Show a loader while the initial session and user profile are being fetched
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-screen text-gray-800 overflow-hidden font-sans">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
        user={user} // <-- Pass the user from our hook
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

      {/* ====== MOBILE OVERLAY ====== */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        ></div>
      )}

      {/* ====== LOGOUT MODAL ====== */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
