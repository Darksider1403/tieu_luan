import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ShoppingBag, Settings, Heart } from "lucide-react";
import { accountService } from "../services/accountService";

function UserMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = accountService.getUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await accountService.logout();
      setUser(null);
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    navigate("/login");
    setIsOpen(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <User className="w-6 h-6 text-gray-700" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {user ? (
            // Logged in menu
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  {user.fullname || user.username}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => handleMenuClick("/profile")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => handleMenuClick("/orders")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </button>

              <button
                onClick={() => handleMenuClick("/wishlist")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
              >
                <Heart className="w-4 h-4" />
                <span>Wishlist</span>
              </button>

              <button
                onClick={() => handleMenuClick("/settings")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Welcome to FashionHub
                </p>
                <p className="text-xs text-gray-500">
                  Sign in to access your account
                </p>
              </div>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={handleLogin}
                className="w-full mx-2 mb-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={() => handleMenuClick("/register")}
                className="w-full mx-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;
