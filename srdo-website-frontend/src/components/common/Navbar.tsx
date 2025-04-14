import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <nav
      className="text-white sticky top-0 z-50 border-b border-green-600"
      style={{ backgroundColor: "#107912" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="font-bold flex items-center">
            <Link to="/" className="flex items-center">
              <div className="bg-white rounded-full p-1 mr-2">
                <img
                  src={`${process.env.PUBLIC_URL}/images/logo/srdo_logo.PNG`}
                  alt="SRDO Logo"
                  className="h-10"
                  style={{ maxHeight: "40px" }}
                />
              </div>
              <span className="text-xl font-bold">SRDO</span>
            </Link>
          </div>
          <ul className="hidden md:flex space-x-6">
            <li>
              <Link
                to="/"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/priorities"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Governor's Priorities
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                to="/news"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                News
              </Link>
            </li>
            <li>
              <Link
                to="/resources"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Resources
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-green-200 transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* User Menu - Only show when authenticated */}
          <div className="relative">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 hover:text-green-200 transition-all duration-300 focus:outline-none"
                >
                  <span>{user?.name}</span>
                  <svg
                    className={`h-5 w-5 transform transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          role="menuitem"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:text-green-200 hover:bg-green-800 transition-colors duration-200 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/priorities"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Priorities
              </Link>
              <Link
                to="/projects"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                to="/news"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                News
              </Link>
              <Link
                to="/resources"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {isAuthenticated && (
                <>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-green-800 transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
