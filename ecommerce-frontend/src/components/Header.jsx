import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Star,
  TrendingUp,
  Sparkles,
  Tag,
} from "lucide-react";
import { productService } from "../services/productService";
import UserMenu from "./UserMenu";

const Header = ({ user, cartSize, onCartSizeUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const categoriesRef = useRef(null);

  // Categories list
  const categories = [
    { id: 1, name: "Men's T-Shirts", icon: "👕" },
    { id: 8, name: "Women's Tops", icon: "👚" },
    { id: 10, name: "Women's Dresses", icon: "👗" },
    { id: 13, name: "Women's Accessories", icon: "👜" },
    { id: 15, name: "Men's Jackets", icon: "🧥" },
  ];

  // Handle scroll for header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle search input
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await productService.searchProducts(value);
        const normalizedResults = results.map((product) => ({
          ...product,
          rating: product.averageRating || Math.random() * 1.5 + 3.5,
        }));
        setSearchResults(normalizedResults.slice(0, 5));
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 300);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target)
      ) {
        setShowCategoriesMenu(false);
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
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>🎉 Free Shipping on orders over ₫500,000! </span>
          <Tag className="w-4 h-4" />
          <span className="hidden sm:inline">
            | New Season Sale - Up to 50% OFF
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-lg" : "shadow-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <a
                href="/home"
                className="flex items-center gap-2 group transition-transform hover:scale-105"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  FashionHub
                </span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center space-x-2">
              <li>
                <a
                  href="/home"
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all hover:bg-purple-50 rounded-lg"
                >
                  Home
                </a>
              </li>
              <li className="relative" ref={categoriesRef}>
                <button
                  onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all hover:bg-purple-50 rounded-lg flex items-center gap-1"
                >
                  Categories
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showCategoriesMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Categories Dropdown */}
                {showCategoriesMenu && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                    {categories.map((category) => (
                      <a
                        key={category.id}
                        href={`/products?category=${category.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                        onClick={() => setShowCategoriesMenu(false)}
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="text-gray-700 font-medium hover:text-purple-600">
                          {category.name}
                        </span>
                      </a>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <a
                        href="/products?category=all"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-purple-50 transition-colors text-purple-600 font-semibold"
                        onClick={() => setShowCategoriesMenu(false)}
                      >
                        <TrendingUp className="w-4 h-4" />
                        View All Products
                      </a>
                    </div>
                  </div>
                )}
              </li>
              <li>
                <a
                  href="/products?category=all"
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all hover:bg-purple-50 rounded-lg"
                >
                  All Products
                </a>
              </li>
            </ul>

            {/* Search Bar */}
            <div
              className="hidden md:flex flex-1 max-w-xl mx-6 relative"
              ref={searchRef}
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInput}
                  placeholder="Search for products..."
                  className="w-full px-5 py-2.5 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 p-1.5 rounded-lg transition-colors cursor-pointer">
                  <Search className="w-4 h-4 text-white" />
                </div>

                {/* Enhanced Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                    {searchResults.length > 0 ? (
                      <ul className="py-2">
                        {searchResults.map((product) => (
                          <li key={product.id}>
                            <a
                              href={`/product/${product.id}`}
                              className="flex items-center px-4 py-3 hover:bg-purple-50 transition-colors group"
                              onClick={() => setShowSearchResults(false)}
                            >
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                                {product.thumbnailImage ? (
                                  <img
                                    src={product.thumbnailImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-purple-600 font-bold">
                                    {formatPrice(product.price)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-500">
                                      {product.rating?.toFixed(1) || "0.0"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No products found
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Try different keywords
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-2">
              {/* Cart */}
              <a
                href="/cart"
                className="relative p-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all group"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartSize > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {cartSize > 99 ? "99+" : cartSize}
                  </span>
                )}
              </a>

              {/* User Menu */}
              <UserMenu />

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
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
            <div className="lg:hidden py-4 border-t border-gray-100 animate-slideDown">
              <div className="space-y-4">
                {/* Mobile Search */}
                <div className="px-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="space-y-1">
                  <a
                    href="/home"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-xl">🏠</span>
                    Home
                  </a>

                  {/* Mobile Categories */}
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Categories
                    </p>
                  </div>
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`/products?category=${category.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-xl">{category.icon}</span>
                      {category.name}
                    </a>
                  ))}

                  <a
                    href="/products?category=all"
                    className="flex items-center gap-3 px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-xl font-semibold transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <TrendingUp className="w-5 h-5" />
                    View All Products
                  </a>
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Add animation styles */}
      <style jsx="true">{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;
