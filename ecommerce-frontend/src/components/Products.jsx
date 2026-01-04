import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import ProductCard from "./ProductCard";
import { ChevronLeft, Search, X } from "lucide-react";

// Category names mapping
const categoryNames = {
  1: "Men's T-Shirts",
  8: "Women's Tops",
  10: "Women's Dresses",
  13: "Women's Accessories",
  15: "Men's Jackets",
};

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get("category");

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let productsData;

        if (categoryId && categoryId !== "all") {
          // Fetch products by specific category
          productsData = await productService.getProductsByCategory(
            parseInt(categoryId),
            100
          );
          setCategoryName(
            categoryNames[categoryId] || `Category ${categoryId}`
          );
        } else {
          // Fetch all products
          productsData = await productService.getProducts();
          setCategoryName("All Products");
        }

        // Normalize ratings like in Home.jsx
        const normalizedProducts = productsData.map((product) => ({
          ...product,
          rating: product.averageRating || Math.random() * 1.5 + 3.5,
        }));

        setAllProducts(normalizedProducts);
        setFilteredProducts(normalizedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...allProducts];

    // Filter by search term (product name)
    if (searchTerm.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.idCategory === parseInt(selectedCategory)
      );
    }

    // Filter by gender
    if (selectedGender && selectedGender !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedGender, allProducts]);

  const handleAddToCart = async (productId) => {
    try {
      const result = await productService.addToCart(productId);
      if (result.success) {
        // You can add a toast notification here if you want
        console.log("Product added to cart");
      }
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(categoryId || "all");
    setSelectedGender("all");
  };

  const hasActiveFilters =
    searchTerm ||
    (selectedCategory !== "all" && selectedCategory !== categoryId) ||
    selectedGender !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={handleBackToHome}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {categoryName}
              </h1>
              <p className="text-gray-600">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>

            {/* Toggle Filters Button - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className={`mb-6 ${showFilters ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search by Name */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter by Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="1">Men's T-Shirts</option>
                  <option value="8">Women's Tops</option>
                  <option value="10">Women's Dresses</option>
                  <option value="13">Women's Accessories</option>
                  <option value="15">Men's Jackets</option>
                </select>
              </div>

              {/* Filter by Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">Active filters applied</p>
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-yellow-800 text-lg mb-2">No products found</p>
              <p className="text-yellow-700 text-sm">
                Try adjusting your filters or search term
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
