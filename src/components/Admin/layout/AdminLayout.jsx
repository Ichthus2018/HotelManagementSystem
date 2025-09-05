// src/layouts/AdminLayout.jsx
import { useState, useEffect, Fragment } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  FaSignOutAlt,
  FaUsers,
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaBook,
  FaCog,
} from "react-icons/fa";

import supabase from "../../../services/supabaseClient";
import LogoutModal from "./LogoutModal"; // The modal we created
import PopoverMenuItem from "./PopoverMenuItem"; // The menu item we created

// Reusable Nav Item Component with blue theme
const NavItem = ({ to, icon, label, sidebarOpen, closeSidebar }) => (
  <li>
    <NavLink
      to={to}
      onClick={() => {
        if (window.innerWidth < 768) closeSidebar(); // Close only on mobile
      }}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 transition-all duration-300 rounded-lg group ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`
      }
    >
      <div className="group-hover:text-gray-800">{icon}</div>
      {sidebarOpen && <span className="ml-3 whitespace-nowrap">{label}</span>}
    </NavLink>
  </li>
);

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login"); // Redirect if not authenticated
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [navigate]);

  // This function is now called when the user CONFIRMS the logout in the modal
  const handleLogout = async () => {
    setIsLogoutModalOpen(false); // Close the modal
    await supabase.auth.signOut();
    navigate("/login");
  };

  // This function opens the confirmation modal
  const handleLogoutClick = (closePopover) => {
    closePopover(); // Close the Popover immediately
    setIsLogoutModalOpen(true); // Open the confirmation modal
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Assuming you have an 'admin' role in your user's app_metadata in Supabase
  // Adjust this logic if your role system is different
  const isAdmin = user?.app_metadata?.role === "admin";

  const profileImage = user?.user_metadata?.avatar_url ? (
    <img
      src={user.user_metadata.avatar_url}
      alt="Profile"
      className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500"
    />
  ) : (
    <FaUserCircle className="h-10 w-10 text-blue-500" />
  );

  // Display name logic
  const displayName =
    user?.user_metadata?.full_name || user?.email || "Administrator";

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden font-sans">
      {/* ====== SIDEBAR ====== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white text-gray-800 border-r border-gray-200 transition-all duration-300 ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64 md:w-20"
          }
          md:static md:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          {sidebarOpen ? (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Manny
            </h1>
          ) : (
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              V
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-full"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <FaChevronLeft size={14} />
            ) : (
              <FaChevronRight size={14} />
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-900"
            aria-label="Close sidebar"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-4 px-3 overflow-y-auto">
          <ul className="space-y-4">
            {/* Manage Section */}
            <li>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Manage
              </h2>
              <div className="space-y-2">
                <NavItem
                  to="/admin/roomTypes"
                  icon={<FaTachometerAlt size={20} />}
                  label="Room Types"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/admin/roomNumbers"
                  icon={<FaUsers size={20} />}
                  label="Room Numbers"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/admin/roomStatus"
                  icon={<FaUsers size={20} />}
                  label="Room Status"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/admin/roomLocations"
                  icon={<FaUsers size={20} />}
                  label="Room Locations"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
                {/* <NavItem
                  to="/admin/SpecialRates"
                  icon={<FaUsers size={20} />}
                  label="SpecialRates"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                /> */}
              </div>
            </li>

            {/* Connections Section */}
            <li>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Connections
              </h2>
              <div className="space-y-2">
                <NavItem
                  to="/admin/cardKeys"
                  icon={<FaUsers size={20} />}
                  label="Card Keys"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/admin/bookings"
                  icon={<FaBook size={20} />}
                  label="Bookings"
                  sidebarOpen={sidebarOpen}
                  closeSidebar={() => setSidebarOpen(false)}
                />
              </div>
            </li>
          </ul>
        </nav>

        {/* User Profile Popover */}
        <Popover className="relative p-4 border-t border-gray-200">
          <PopoverButton className="flex items-center gap-3 cursor-pointer rounded-lg p-2 hover:bg-gray-100 transition-all w-full text-left">
            {profileImage}
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-blue-600 font-medium">
                  {isAdmin ? "Admin" : "User"}
                </p>
              </div>
            )}
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel
              className={`absolute z-50 w-60 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 ${
                sidebarOpen ? "bottom-20 left-4" : "left-2 bottom-20"
              }`}
            >
              {({ close }) => (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="text-base font-semibold text-gray-800 truncate">
                      {displayName}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="py-2">
                      <p className="px-4 pt-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Admin Settings
                      </p>
                      <ul className="space-y-1">
                        <li>
                          <PopoverMenuItem
                            to="/admin/settings"
                            icon={<FaCog size={16} />}
                            label="General Settings"
                            close={close}
                          />
                        </li>
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => handleLogoutClick(close)}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="mr-3" />
                    Logout
                  </button>
                </>
              )}
            </PopoverPanel>
          </Transition>
        </Popover>
      </aside>

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
