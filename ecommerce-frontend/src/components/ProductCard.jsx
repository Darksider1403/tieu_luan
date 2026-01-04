import React, { useState } from "react";
import { ShoppingCart, Star, Eye, Heart, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const truncateName = (name, maxLength = 35) => {
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  const hasImage =
    product.thumbnailImage && product.thumbnailImage.trim() !== "";

  // Calculate discount percentage (if original price exists)
  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  // Check if product is new (e.g., created within last 7 days)
  const isNew = product.createdAt
    ? new Date() - new Date(product.createdAt) < 7 * 24 * 60 * 60 * 1000
    : false;

  // Check if trending (high rating)
  const isTrending = product.rating && product.rating >= 4.5;

  // Stock status
  const inStock = product.quantity > 0;
  const lowStock = product.quantity > 0 && product.quantity <= 10;

  const handleViewDetails = () => {
    if (!product?.id) {
      setToast({
        message: "Product ID is missing!",
        type: "error",
      });
      return;
    }
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = async () => {
    try {
      await onAddToCart(product.id);
      setToast({
        message: `${product.name} added to cart successfully!`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Failed to add item to cart",
        type: "error",
      });
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    setToast({
      message: isWishlisted ? "Removed from wishlist" : "Added to wishlist!",
      type: "success",
    });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-purple-200 relative">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {discountPercentage > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              -{discountPercentage}%
            </span>
          )}
          {isNew && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3" />
              NEW
            </span>
          )}
          {isTrending && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              HOT
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm hover:bg-white p-2.5 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }`}
          />
        </button>

        {/* Image Container */}
        <div
          className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
          onClick={handleViewDetails}
        >
          {hasImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
              <img
                src={product.thumbnailImage}
                alt={product.name}
                className={`w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-72 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <div className="text-center text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-2 opacity-30" />
                <span className="text-sm">No Image Available</span>
              </div>
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium text-sm hover:scale-105"
              >
                <Eye className="w-4 h-4" />
                Quick View
              </button>
              {inStock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium text-sm hover:scale-105"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Out of Stock Overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          {/* Product Name */}
          <h3
            className="font-semibold text-gray-900 mb-2 h-12 leading-6 hover:text-purple-600 transition-colors cursor-pointer"
            onClick={handleViewDetails}
            title={product.name}
          >
            {truncateName(product.name)}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-600">
              {product.rating ? product.rating.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-gray-400">
              ({product.reviewCount || 0} reviews)
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
            </div>
            {lowStock && (
              <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Only {product.quantity} left in stock!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {inStock ? (
              <>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleViewDetails}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-4 rounded-xl font-semibold transition-all hover:shadow-md"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-200 text-gray-500 py-2.5 px-4 rounded-xl font-semibold cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      </div>
    </>
  );
};

export default ProductCard;
