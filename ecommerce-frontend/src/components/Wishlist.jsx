import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ShoppingBag,
  Star,
  Eye,
  ArrowRight,
  Package,
} from "lucide-react";
import Toast from "./Toast";
import { productService } from "../services/productService";
import apiClient from "../services/apiService";

function Wishlist() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      // Try to fetch from API
      try {
        const response = await apiClient.get("/wishlist");
        setWishlistItems(response.data || []);
      } catch (error) {
        // If API fails, use localStorage
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
          const productIds = JSON.parse(savedWishlist);
          // Fetch product details for each ID
          const products = await Promise.all(
            productIds.map((id) =>
              productService.getProduct(id).catch(() => null)
            )
          );
          setWishlistItems(products.filter((p) => p !== null));
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setToast({
        message: "Failed to load wishlist",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      // Try API first
      try {
        await apiClient.delete(`/wishlist/${productId}`);
      } catch (error) {
        // Update localStorage if API fails
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
          const productIds = JSON.parse(savedWishlist);
          const updatedIds = productIds.filter((id) => id !== productId);
          localStorage.setItem("wishlist", JSON.stringify(updatedIds));
        }
      }

      setWishlistItems(wishlistItems.filter((item) => item.id !== productId));
      setToast({
        message: "Item removed from wishlist",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Failed to remove item",
        type: "error",
      });
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await productService.addToCart(product.id);
      setToast({
        message: `${product.name} added to cart successfully!`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Failed to add to cart",
        type: "error",
      });
    }
  };

  const handleAddAllToCart = async () => {
    try {
      let successCount = 0;
      for (const item of wishlistItems) {
        try {
          await productService.addToCart(item.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to add ${item.name}:`, error);
        }
      }
      setToast({
        message: `${successCount} items added to cart!`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Failed to add items to cart",
        type: "error",
      });
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?"))
      return;

    try {
      try {
        await apiClient.delete("/wishlist/clear");
      } catch (error) {
        localStorage.removeItem("wishlist");
      }
      setWishlistItems([]);
      setToast({
        message: "Wishlist cleared",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Failed to clear wishlist",
        type: "error",
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-pink-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your Wishlist is Empty
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                Save your favorite items here and never lose track of what you
                love!
              </p>
              <button
                onClick={() => navigate("/products")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-10 h-10 text-pink-500 fill-current" />
                My Wishlist
              </h1>
              <p className="text-gray-500 mt-2">
                {wishlistItems.length}{" "}
                {wishlistItems.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAllToCart}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add All to Cart
              </button>
              <button
                onClick={handleClearWishlist}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all border border-red-200 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <WishlistCard
              key={product.id}
              product={product}
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
              onView={() => navigate(`/product/${product.id}`)}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg border border-gray-200"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

// Wishlist Card Component
const WishlistCard = ({
  product,
  onRemove,
  onAddToCart,
  onView,
  formatPrice,
}) => {
  const hasImage =
    product.thumbnailImage && product.thumbnailImage.trim() !== "";

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 relative">
      {/* Remove Button */}
      <button
        onClick={() => onRemove(product.id)}
        className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm hover:bg-red-50 p-2 rounded-full shadow-lg transition-all hover:scale-110 group/btn"
      >
        <Trash2 className="w-4 h-4 text-gray-600 group-hover/btn:text-red-600 transition-colors" />
      </button>

      {/* Product Image */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer h-64"
        onClick={onView}
      >
        {hasImage ? (
          <img
            src={product.thumbnailImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition-colors cursor-pointer"
          onClick={onView}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {product.rating ? product.rating.toFixed(1) : "0.0"}
          </span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Stock Status */}
        {product.quantity > 0 ? (
          <div className="flex items-center gap-1 mb-4 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">In Stock</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-4 text-sm text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">Out of Stock</span>
          </div>
        )}

        {/* Add to Cart Button */}
        {product.quantity > 0 ? (
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-semibold cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
