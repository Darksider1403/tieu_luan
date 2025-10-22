import React, { useState } from "react";
import { ShoppingCart, Star, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const truncateName = (name, maxLength = 30) => {
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  const hasImage =
    product.thumbnailImage && product.thumbnailImage.trim() !== "";

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

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
        <div className="relative overflow-hidden bg-gray-100">
          {hasImage ? (
            <img
              src={product.thumbnailImage}
              alt={product.name}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-400">
              <span>No Image</span>
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleViewDetails}
              className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 h-12">
            {truncateName(product.name)}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-purple-600">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center space-x-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm text-gray-600">
                {product.rating ? product.rating.toFixed(1) : "0.0"}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleViewDetails}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
