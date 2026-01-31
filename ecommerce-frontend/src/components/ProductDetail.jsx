import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, StarHalf, ShoppingCart, ArrowLeft } from "lucide-react";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import ProductImageGallery from "./ProductImageGallery";
import Toast from "./Toast";
import ProductRating from "./ProductRating";
import ProductComments from "./ProductComments";
import SuggestedProducts from "./SuggestedProducts";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);

  // Consolidated fetch effect
  useEffect(() => {
    if (!id) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await productService.getProduct(id);
        console.log("📦 Product Data from API:", data);
        console.log("Material:", data.Material, "Size:", data.Size, "Color:", data.Color);
        
        // Parse description if material/size/color are empty
        if (data.description && (!data.material || !data.size || !data.color)) {
          const parts = data.description.split(' - ').map(p => p.trim());
          if (parts.length >= 3) {
            data.material = data.material || parts[0];
            data.size = data.size || parts[1];
            data.color = data.color || parts[2];
            console.log("✅ Parsed from description:", { material: data.material, size: data.size, color: data.color });
          }
        }
        
        setProduct(data);

        const imagesData = await productService.getProductImages(id);
        console.log("Images loaded:", imagesData);
        setImages(imagesData || {});
      } catch (err) {
        setError(err.message || "Failed to fetch product");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Set first image when images are loaded
  useEffect(() => {
    if (Object.keys(images).length > 0) {
      const firstImage = images["0"];
      if (firstImage) {
        setSelectedImage(firstImage);
      }
    }
  }, [images]);

  const handleRatingUpdate = () => {
    // Refresh product data when rating is updated
    if (id) {
      const refetchProduct = async () => {
        try {
          const data = await productService.getProduct(id);
          setProduct(data);
        } catch (err) {
          console.error("Error refreshing product:", err);
        }
      };
      refetchProduct();
    }
  };

  const updateCartSize = async () => {
    try {
      // Only update cart size if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const size = await cartService.getCartSize();
      // You can emit this to parent component if needed
    } catch (error) {
      console.error("Error updating cart size:", error);
    }
  };

  const addToCart = async () => {
    try {
      setIsAddingToCart(true);

      if (!product.id) {
        throw new Error("Product ID is missing");
      }

      for (let i = 0; i < quantity; i++) {
        await cartService.addToCart(product.id, 1);
      }

      setToast({
        message: `Đã thêm ${quantity} sản phẩm vào giỏ hàng!`,
        type: "success",
      });
      setQuantity(1);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setToast({
        message: `Không thể thêm sản phẩm: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 > 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="fill-yellow-400 text-yellow-400" size={20} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf
            key={i}
            className="fill-yellow-400 text-yellow-400"
            size={20}
          />
        );
      } else {
        stars.push(<Star key={i} className="text-gray-300" size={20} />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Sản phẩm không tồn tại"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <nav className="container mx-auto px-4 py-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={() => navigate("/")}
              className="hover:text-blue-600"
            >
              Trang chủ
            </button>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border rounded-lg p-8">
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
              <ProductImageGallery images={images} productName={product.name} />
            </div>

            {/* Product Information Card */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
                Thông tin sản phẩm
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-lg flex-shrink-0">
                    📦
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Chất liệu</p>
                    <p className="text-sm text-gray-600">{product.Material || product.material || "Chưa cập nhật"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-lg flex-shrink-0">
                    📏
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Kích thước</p>
                    <p className="text-sm text-gray-600">{product.Size || product.size || "Chưa cập nhật"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-lg flex-shrink-0">
                    🎨
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Màu sắc</p>
                    <p className="text-sm text-gray-600">{product.Color || product.color || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-lg flex-shrink-0">
                    📊
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Danh mục</p>
                    <p className="text-sm text-gray-600">
                      {product.CategoryName || product.categoryName || "Thời trang"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-lg flex-shrink-0">
                    🏷️
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Mã sản phẩm</p>
                    <p className="text-sm text-gray-600 font-mono">{product.Id || product.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {product.name}
            </h1>

            <p className="text-4xl font-bold text-blue-600 mb-4">
              {product.price?.toLocaleString("vi-VN")}đ
            </p>

            <p className="text-gray-700 mb-8">
              Tình trạng:{" "}
              <span
                className={`font-semibold ${
                  product.quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.quantity > 0
                  ? `Còn ${product.quantity} sản phẩm`
                  : "Hết hàng"}
              </span>
            </p>

            {/* Quantity Selector */}
            <div className="space-y-2 mb-6">
              <label className="font-semibold text-gray-900">Số lượng:</label>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg"
                  disabled={isAddingToCart}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 text-center border-0 py-2 focus:outline-none"
                  disabled={isAddingToCart}
                />
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.quantity, quantity + 1))
                  }
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg"
                  disabled={isAddingToCart}
                >
                  +
                </button>
              </div>
            </div>

            {/* Wishlist Button */}
            <button className="w-full border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mb-6">
              <span className="text-xl">♡</span>
              Thêm vào yêu thích
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={product.quantity <= 0 || isAddingToCart}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors mb-8"
            >
              <ShoppingCart size={20} />
              {isAddingToCart
                ? "Đang thêm..."
                : product.quantity > 0
                ? "Thêm vào giỏ hàng"
                : "Hết hàng"}
            </button>

            {/* Product Features */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-lg flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    Miễn phí vận chuyển
                  </p>
                  <p className="text-sm text-gray-600">
                    cho đơn hàng trên 100.000đ
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-lg flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    Đảm bảo chất lượng
                  </p>
                  <p className="text-sm text-gray-600">100% hàng chính hãng</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-lg flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900">Hoàn tiền 30 ngày</p>
                  <p className="text-sm text-gray-600">nếu không hài lòng</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-lg flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900">Hỗ trợ 24/7</p>
                  <p className="text-sm text-gray-600">
                    Liên hệ với chúng tôi bất cứ lúc nào
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Rating Section - Full Width */}
        <div className="mb-8">
          <ProductRating
            productId={id}
            onRatingSubmit={handleRatingUpdate}
          />
        </div>

        {/* Comments Section */}
        <ProductComments productId={id} />

        {/* Suggested Products Section */}
        {product?.categoryId && (
          <div className="mt-8">
            <SuggestedProducts
              currentProductId={product.id}
              categoryId={product.categoryId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
