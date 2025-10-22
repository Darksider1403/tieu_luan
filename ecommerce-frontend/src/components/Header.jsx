import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import apiClient from "../services/apiService";
import UserMenu from "./UserMenu"; // Add this import

const Header = ({ user, cartSize, onCartSizeUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Handle search input
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await apiClient.searchProducts(value);
        setSearchResults(results.slice(0, 5)); // Show max 5 results
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 300);
  };

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <a href="/home" className="text-2xl font-bold text-purple-600">
              FashionHub
            </a>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-8">
            <li>
              <a
                href="/home"
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Trang chủ
              </a>
            </li>
            <li>
              <a
                href="/products?category=1&page=1"
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Danh sách sản phẩm
              </a>
            </li>
          </ul>

          {/* Search Bar */}
          <div
            className="hidden md:flex flex-1 max-w-md mx-8 relative"
            ref={searchRef}
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchInput}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                  {searchResults.length > 0 ? (
                    <ul className="py-2">
                      {searchResults.map((product) => (
                        <li key={product.id}>
                          <a
                            href={`/product/${product.id}`}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => setShowSearchResults(false)}
                          >
                            <img
                              src={
                                product.thumbnailImage ||
                                "/api/placeholder/50/50"
                              }
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded mr-3"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {product.name.length > 40
                                  ? product.name.substring(0, 40) + "..."
                                  : product.name}
                              </p>
                              <p className="text-purple-600 font-semibold text-sm">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <a
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartSize > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartSize > 99 ? "99+" : cartSize}
                </span>
              )}
            </a>

            {/* User Menu - REPLACED */}
            <UserMenu />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Mobile Search */}
              <div className="px-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-2">
                <a
                  href="/home"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trang chủ
                </a>
                <a
                  href="/products?category=1&page=1"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Danh sách sản phẩm
                </a>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
