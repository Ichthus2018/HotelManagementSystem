// src/layouts/Sidebar.jsx
import { Fragment } from "react";
import { NavLink } from "react-router-dom";
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
  FaTimes,
  FaCog,
  FaBed,
  FaList,
  FaClipboardList,
  FaMapMarkedAlt,
  FaKey,
  FaDoorOpen,
  FaServer,
  FaHotel,
  FaMoneyBill,
  FaFolder,
  FaFolderOpen,
  FaBoxes,
  FaListAlt,
  FaTags,
  FaCubes,
  FaKeycdn,
} from "react-icons/fa";
import PopoverMenuItem from "./PopoverMenuItem";
import { RiHotelFill } from "react-icons/ri";
import { GiStatic } from "react-icons/gi";
import { FcStatistics } from "react-icons/fc";

// Reusable Nav Item Component - It's self-contained and perfect to live here.
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

// The Main Sidebar Component
export default function Sidebar({
  sidebarOpen,
  toggleSidebar,
  setSidebarOpen,
  user,
  handleLogoutClick,
}) {
  // All display logic derived from props is now contained within the Sidebar component
  const isAdmin = user?.app_metadata?.role === "admin";
  const displayName =
    user?.user_metadata?.full_name || user?.email || "Administrator";
  const profileImage = user?.user_metadata?.avatar_url ? (
    <img
      src={user.user_metadata.avatar_url}
      alt="Profile"
      className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500"
    />
  ) : (
    <FaUserCircle className="h-10 w-10 text-blue-500" />
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white text-gray-800 border-r border-gray-200 transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:w-20"}
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
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Manage
              </h2>
            )}
            <ul className="space-y-2">
              <NavItem
                to="/admin/dashboard"
                icon={<FcStatistics size={20} />}
                label="Dashboard"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/hotelInformation"
                icon={<RiHotelFill size={20} />}
                label="Hotel Information"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />

              <NavItem
                to="/admin/roomTypes"
                icon={<FaBed size={20} />}
                label="Room"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              {/* ... other NavItems ... */}
              {/* <NavItem
                to="/admin/roomNumbers"
                icon={<FaList size={20} />}
                label="Room Numbers"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              /> */}
              <NavItem
                to="/admin/personnel"
                icon={<FaUsers size={20} />}
                label="Personnel"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />

              <NavItem
                to="/admin/roomStatus"
                icon={<FaClipboardList size={20} />}
                label="Room Status"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/roomLocations"
                icon={<FaMapMarkedAlt size={20} />}
                label="Room Locations"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/item"
                icon={<FaCubes size={20} />} // Item/Type grouping
                label="Items"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
            </ul>
          </li>

          {/* Connections Section */}
          <li>
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Connections
              </h2>
            )}
            <ul className="space-y-2">
              {/* <NavItem
                to="/admin/cardKeys"
                icon={<FaKey size={20} />}
                label="Card Keys"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              /> */}
              <NavItem
                to="/admin/lockCardManager"
                icon={<FaKey size={20} />}
                label="Lock Card Manager"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              {/* ... other NavItems ... */}
              <NavItem
                to="/admin/doorLocks"
                icon={<FaDoorOpen size={20} />}
                label="Door Locks"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/gateways"
                icon={<FaServer size={20} />}
                label="Gateways"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
            </ul>
          </li>
          {/* Item Maintenance Section */}
          <li>
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Item Maintenance
              </h2>
            )}
            <ul className="space-y-2">
              <NavItem
                to="/admin/categories1"
                icon={<FaFolder size={20} />} // Category icon
                label="Categories 1"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/categories2"
                icon={<FaFolderOpen size={20} />} // Another folder icon
                label="Categories 2"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/categories3"
                icon={<FaBoxes size={20} />} // For grouped categories
                label="Categories 3"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/categories4"
                icon={<FaListAlt size={20} />} // List-type icon
                label="Categories 4"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/categories5"
                icon={<FaTags size={20} />} // Tagging categories
                label="Categories 5"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/itemType"
                icon={<FaCubes size={20} />} // Item/Type grouping
                label="Item Type"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
            </ul>
          </li>
          {/* Operations Section */}
          <li>
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Operations
              </h2>
            )}
            <ul className="space-y-2">
              <NavItem
                to="/admin/bookings"
                icon={<FaClipboardList size={20} />}
                label="Bookings"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/guests"
                icon={<FaUsers size={20} />}
                label="Guests"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/hotelfacilities"
                icon={<FaHotel size={20} />}
                label="Hotel Facilities"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/chargeItems"
                icon={<FaMoneyBill size={20} />}
                label="Charge Items"
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
              />
            </ul>
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

        <Transition as={Fragment}>
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
  );
}
