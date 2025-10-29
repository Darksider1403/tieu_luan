import React from "react";
import { X, Package, DollarSign, Hash, Info, ImageIcon } from "lucide-react";

function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  // Get product image
  const getProductImage = () => {
    if (product.imageUrl) return product.imageUrl;
    if (product.img1) return product.img1;
    if (product.image) return product.image;
    if (product.id) return `/images/products/${product.id}/1.jpg`;
    return null;
  };

  const imageUrl = getProductImage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">
            Product Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-full h-full flex items-center justify-center text-gray-400"
              style={{ display: imageUrl ? "none" : "flex" }}
            >
              <ImageIcon className="w-24 h-24" />
            </div>
          </div>

          {/* Rest of the modal content remains the same */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Product ID
              </label>
              <p className="text-base text-gray-900">{product.id}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Name
              </label>
              <p className="text-base text-gray-900 font-medium">
                {product.name}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price
              </label>
              <p className="text-base text-gray-900 font-semibold">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Quantity in Stock
              </label>
              <p className="text-base text-gray-900">{product.quantity}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Category ID
              </label>
              <p className="text-base text-gray-900">{product.idCategory}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                  product.status === 1
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.status === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Description
              </label>
              <p className="text-base text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductViewModal;
