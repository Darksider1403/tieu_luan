import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  ArrowUpDown,
  Image as ImageIcon,
} from "lucide-react";
import { productService } from "../../services/productService";
import Toast from "../Toast";
import ProductViewModal from "../ProductViewModal";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id-asc");
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    material: "",
    size: "",
    color: "",
    gender: "",
    idCategory: 1,
    status: 1,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Admin uses getAllProductsAdmin to get all products without pagination
      const data = await productService.getAllProductsAdmin();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setToast({
        message: "Failed to load products",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get product image URL
  const getProductImage = (product) => {
    // If product has thumbnailImage property (used by ProductCard)
    if (product.thumbnailImage) {
      return product.thumbnailImage;
    }

    // If product has imageUrl property
    if (product.imageUrl) {
      return product.imageUrl;
    }

    // If product has img1 property (common in some schemas)
    if (product.img1) {
      return product.img1;
    }

    // If product has image property
    if (product.image) {
      return product.image;
    }

    // Construct image path based on product ID
    // Adjust this path based on your backend structure
    if (product.id) {
      return `/images/products/${product.id}/1.jpg`;
    }

    // Default placeholder
    return null;
  };

  // Sorting function
  const getSortedProducts = (productsToSort) => {
    const sorted = [...productsToSort];

    switch (sortBy) {
      case "id-asc":
        return sorted.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      case "id-desc":
        return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case "price-desc":
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case "stock-asc":
        return sorted.sort(
          (a, b) => parseInt(a.quantity) - parseInt(b.quantity)
        );
      case "stock-desc":
        return sorted.sort(
          (a, b) => parseInt(b.quantity) - parseInt(a.quantity)
        );
      default:
        return sorted;
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id?.toString().includes(searchTerm)
  );

  const sortedAndFilteredProducts = getSortedProducts(filteredProducts);

  const handleView = async (product) => {
    try {
      const fullProduct = await productService.getProduct(product.id);
      setViewingProduct(fullProduct);
      setShowViewModal(true);
    } catch (error) {
      setToast({
        message: "Failed to load product details",
        type: "error",
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Parse description if it exists (format: "Material - Size - Color")
    const descParts = product.description ? product.description.split(' - ') : [];
    setFormData({
      name: product.name || "",
      price: product.price || "",
      quantity: product.quantity || "",
      material: descParts[0] || product.material || "",
      size: descParts[1] || product.size || "",
      color: descParts[2] || product.color || "",
      gender: product.gender || "",
      idCategory: product.idCategory || 1,
      status: product.status || 1,
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      quantity: "",
      material: "",
      size: "",
      color: "",
      gender: "",
      idCategory: 1,
      status: 1,
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      
      if (editingProduct) {
        // Update product
        submitData.append('Name', formData.name);
        submitData.append('Price', formData.price);
        submitData.append('Quantity', formData.quantity);
        submitData.append('Material', formData.material || 'Cotton');
        submitData.append('Size', formData.size || 'M');
        submitData.append('Color', formData.color || 'Black');
        submitData.append('Gender', formData.gender || 'Unisex');
        submitData.append('IdCategory', formData.idCategory);
        
        // Add images if selected
        if (selectedImages.length > 0) {
          selectedImages.forEach(image => {
            submitData.append('Images', image);
          });
          submitData.append('KeepExistingImages', 'false');
        }
        
        await productService.updateProduct(editingProduct.id, submitData);
        setToast({
          message: "Product updated successfully",
          type: "success",
        });
      } else {
        // Create product
        if (selectedImages.length === 0) {
          setToast({
            message: "Please select at least one image",
            type: "error",
          });
          return;
        }
        
        // Generate next product ID
        const maxId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id))) : 0;
        const newId = (maxId + 1).toString();
        
        submitData.append('Id', newId);
        submitData.append('Name', formData.name);
        submitData.append('Price', formData.price);
        submitData.append('Quantity', formData.quantity);
        submitData.append('Material', formData.material || 'Cotton');
        submitData.append('Size', formData.size || 'M');
        submitData.append('Color', formData.color || 'Black');
        submitData.append('Gender', formData.gender || 'Unisex');
        submitData.append('IdCategory', formData.idCategory);
        
        // Add images
        selectedImages.forEach(image => {
          submitData.append('Images', image);
        });
        
        await productService.createProduct(submitData);
        setToast({
          message: "Product created successfully",
          type: "success",
        });
      }
      setShowModal(false);
      setSelectedImages([]);
      setImagePreviews([]);
      fetchProducts();
    } catch (error) {
      console.error('Submit error:', error);
      setToast({
        message: error.response?.data?.error || "Operation failed",
        type: "error",
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 4 images
    if (files.length > 4) {
      setToast({
        message: "Maximum 4 images allowed",
        type: "error",
      });
      return;
    }
    
    // Validate file size (5MB max per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setToast({
        message: "Some files exceed 5MB limit",
        type: "error",
      });
      return;
    }
    
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      setToast({
        message: "Only JPG, PNG, GIF, and WebP images are allowed",
        type: "error",
      });
      return;
    }
    
    setSelectedImages(files);
    
    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await productService.deleteProduct(productId);
      setToast({
        message: "Product deleted successfully",
        type: "success",
      });
      fetchProducts();
    } catch (error) {
      setToast({
        message: "Failed to delete product",
        type: "error",
      });
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await productService.updateProductStatus(productId, newStatus);
      setToast({
        message: "Product status updated successfully",
        type: "success",
      });
      fetchProducts();
    } catch (error) {
      setToast({
        message: "Failed to update product status",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product inventory
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="id-asc">ID: Low to High</option>
              <option value="id-desc">ID: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedAndFilteredProducts.length > 0 ? (
                sortedAndFilteredProducts.map((product) => {
                  const imageUrl = getProductImage(product);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* Product Image */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex items-center justify-center text-gray-400"
                            style={{ display: imageUrl ? "none" : "flex" }}
                          >
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        </div>
                      </td>

                      {/* Product ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          #{product.id}
                        </div>
                      </td>

                      {/* Product Name & Description */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.price)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            product.quantity < 10
                              ? "text-red-600"
                              : product.quantity < 50
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {product.quantity}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleStatusToggle(product.id, product.status)
                          }
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.status === 1 ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(product)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && viewingProduct && (
        <ProductViewModal
          product={viewingProduct}
          onClose={() => {
            setShowViewModal(false);
            setViewingProduct(null);
          }}
        />
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    placeholder="e.g., Cotton, Polyester"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    placeholder="e.g., S, M, L, XL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="e.g., Black, White, Red"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                  <span className="text-xs text-gray-500 ml-2">
                    (Max 4 images, first image will be thumbnail)
                  </span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="product-images"
                    required={!editingProduct}
                  />
                  <label
                    htmlFor="product-images"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload images
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPG, PNG, GIF, WebP (max 5MB each)
                    </span>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          {index === 0 ? "Thumbnail" : `${index}.jpg`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category ID
                  </label>
                  <input
                    type="number"
                    value={formData.idCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCategory: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProduct ? "Update" : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
