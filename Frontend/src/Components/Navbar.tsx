import { useEffect, useRef, useState } from "react";
import {
  FaShieldAlt,
  FaUserShield,
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        adminButtonRef.current &&
        !adminButtonRef.current.contains(e.target as Node) &&
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const getInitials = (name: string | undefined) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    const initials = nameParts
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return initials;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node) &&
        adminButtonRef.current &&
        !adminButtonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      {token ? (
        <>
          {location.pathname.startsWith("/admin") ? (
            <>
              <nav className="bg-indigo-700 text-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16 items-center">
                    {/* Logo / Brand */}
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-3"
                    >
                      <FaShieldAlt className="text-2xl" />
                      <span className="text-xl font-bold">Admin Panel</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6 relative">
                      <Link
                        to="/admin/dashboard"
                        className="font-medium hover:underline"
                      >
                        User Management
                      </Link>
                      <Link
                        to="/admin/attendance"
                        className="font-medium hover:underline"
                      >
                        Attendance
                      </Link>
                      <Link
                        to="/admin/status-report"
                        className="font-medium hover:underline"
                      >
                        Status Report
                      </Link>

                      {/* Avatar + Dropdown */}
                      <div className="relative">
                        <button
                          ref={adminButtonRef}
                          className={`flex items-center space-x-2 rounded-full p-1 ${
                            dropdownOpen ? "border-2 border-white" : ""
                          }`}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                            <FaUserShield />
                          </div>
                          <span className="hidden sm:block font-medium">
                            Admin
                          </span>
                        </button>

                        {dropdownOpen && (
                          <div
                            ref={adminDropdownRef}
                            className="absolute right-0 mt-2 w-32 bg-white text-black rounded-md shadow-lg py-1 z-10 border"
                          >
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-2xl focus:outline-none"
                      >
                        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                  <div className="md:hidden px-4 pb-4">
                    <Link
                      to="/admin/dashboard"
                      className="block py-2 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      User Management
                    </Link>
                    <Link
                      to="/admin/attendance"
                      className="block py-2 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Attendance
                    </Link>
                    <Link
                      to="/admin/status-report"
                      className="block py-2 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Status Report
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 font-medium text-red-200 hover:text-white"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </nav>
            </>
          ) : (
            <>
              <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  {/* Website Name */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Time Tracker
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="ml-4 flex items-center md:ml-6 relative">
                      <button
                        ref={profileRef}
                        onClick={() => setProfileOpen((v) => !v)}
                        className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-haspopup="true"
                        aria-expanded={profileOpen}
                      >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {getInitials(user?.fullName)}
                        </div>
                        <span className="ml-2 hidden md:inline text-gray-700 font-medium">
                          {user?.fullName}
                        </span>
                        <span className="ml-1 text-gray-500 text-xs hidden md:inline">
                          {profileOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </button>
                      {/* Dropdown menu */}
                      {profileOpen && (
                        <div
                          ref={dropdownRef}
                          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 top-10"
                          role="menu"
                        >
                          <button
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left cursor-pointer"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </nav>
            </>
          )}
        </>
      ) : (
        <>
          <>
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Website Name */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <Link
                    to="/"
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  >
                    Time Tracker
                  </Link>
                </div>

                {/* Auth Button */}
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md font-medium transition-all duration-200 hover:scale-105 "
                  >
                    Login
                  </Link>
                </div>
              </div>
            </nav>
          </>
        </>
      )}
    </div>
  );
};

export default Navbar;