// src/layouts/Navbar.jsx
import { useState, Fragment } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import supabase from "../../../services/supabaseClient"; // Assuming path is correct

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaBook,
  FaSignOutAlt,
} from "react-icons/fa";
import LogoutModal from "../../Admin/layout/LogoutModal";

// Reusable Nav Item for both desktop and mobile
const NavItem = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleLogoutClick = (closePopover) => {
    if (closePopover) closePopover(); // Close popover if function is passed
    setMobileMenuOpen(false); // Close mobile menu if open
    setIsLogoutModalOpen(true);
  };

  // Logic for displaying user avatar or initials
  const renderUserProfile = () => {
    const avatarUrl = user?.user_metadata?.avatar_url;
    const fullName = user?.user_metadata?.full_name;
    const email = user?.email;
    const initials = fullName
      ? fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : email?.charAt(0).toUpperCase();

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Profile"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
        />
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold ring-2 ring-white text-sm">
        {initials}
      </div>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
              >
                Stay Suite 7
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <NavItem to="/">Home</NavItem>
              <NavItem to="/rooms">Rooms</NavItem>
              {user && <NavItem to="/my-bookings">My Bookings</NavItem>}
            </div>

            {/* Right side: Login/User Menu */}
            <div className="hidden md:block">
              {user ? (
                <Popover className="relative">
                  <PopoverButton className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {renderUserProfile()}
                  </PopoverButton>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <PopoverPanel className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {({ close }) => (
                        <div className="py-1">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm text-gray-500">
                              Signed in as
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            to="/my-bookings"
                            onClick={close}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FaBook className="mr-3 text-gray-400" /> My
                            Bookings
                          </Link>
                          <button
                            onClick={() => handleLogoutClick(close)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <FaSignOutAlt className="mr-3" /> Logout
                          </button>
                        </div>
                      )}
                    </PopoverPanel>
                  </Transition>
                </Popover>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Open main menu"
              >
                <FaBars className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <Transition show={mobileMenuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 md:hidden"
          onClose={setMobileMenuOpen}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                      <div className="px-4 sm:px-6 flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold text-blue-600">
                          Menu
                        </DialogTitle>
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FaTimes className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div className="flex flex-col space-y-2">
                          <NavItem
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Home
                          </NavItem>
                          <NavItem
                            to="/rooms"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Rooms
                          </NavItem>
                          {user && (
                            <NavItem
                              to="/my-bookings"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              My Bookings
                            </NavItem>
                          )}
                        </div>
                        <div className="border-t border-gray-200 mt-6 pt-6">
                          {user ? (
                            <div className="flex items-center space-x-3 mb-4">
                              {renderUserProfile()}
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.user_metadata?.full_name || user.email}
                                </p>
                                <button
                                  onClick={() => handleLogoutClick(null)}
                                  className="text-sm text-red-600"
                                >
                                  Logout
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Link
                              to="/login"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Login / Sign Up
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
