import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Eye, TrendingUp, Sparkles } from "lucide-react";
import { productService } from "../services/productService";

function SuggestedProducts({ currentProductId, categoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        setLoading(true);
        let suggestedProducts = [];

        // First, try to get products from the same category
        if (categoryId) {
          const categoryProducts = await productService.getProductsByCategory(
            categoryId,
            8
          );
          const filtered = categoryProducts.filter(
            (p) => p.id !== currentProductId
          );
          suggestedProducts = filtered.slice(0, 4);
        }

        // If we don't have enough products (less than 4), add random products from all categories
        if (suggestedProducts.length < 4) {
          try {
            const pagedResult = await productService.getProducts();
            // Extract items from PagedResult
            const allProducts = pagedResult.items || pagedResult || [];
            // Filter out current product and already selected products
            const selectedIds = new Set([
              currentProductId,
              ...suggestedProducts.map((p) => p.id),
            ]);
            const otherProducts = Array.isArray(allProducts) 
              ? allProducts.filter((p) => !selectedIds.has(p.id))
              : [];

            // Shuffle and take random products to fill up to 4 total
            const shuffled = otherProducts.sort(() => Math.random() - 0.5);
            const needed = 4 - suggestedProducts.length;
            suggestedProducts = [
              ...suggestedProducts,
              ...shuffled.slice(0, needed),
            ];
          } catch (error) {
            console.error("Error fetching additional products:", error);
          }
        }

        // Fetch images for each product
        const productsWithImages = await Promise.all(
          suggestedProducts.map(async (product, index) => {
            try {
              const images = await productService.getProductImages(product.id);
              const firstImage = images["0"] || product.thumbnailImage || null;
              // Randomly assign trending status to make it more dynamic (for study purposes)
              const isTrending = Math.random() > 0.6; // 40% chance of being trending
              return {
                ...product,
                imageUrl: firstImage,
                rating: product.averageRating || Math.random() * 1.5 + 3.5,
                isTrending: isTrending,
              };
            } catch (error) {
              console.error(
                `Error fetching image for product ${product.id}:`,
                error
              );
              return {
                ...product,
                imageUrl: product.thumbnailImage || null,
                rating: product.averageRating || Math.random() * 1.5 + 3.5,
                isTrending: Math.random() > 0.6,
              };
            }
          })
        );

        setProducts(productsWithImages);
      } catch (error) {
        console.error("Error fetching suggested products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedProducts();
  }, [categoryId, currentProductId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              You May Also Like
            </h2>
            <p className="text-sm text-gray-500">
              Curating similar products...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-56 rounded-xl mb-4"></div>
              <div className="bg-gray-200 h-4 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded-lg w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-lg border border-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              You May Also Like
            </h2>
            <p className="text-sm text-gray-500">
              Based on your current selection
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-purple-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium">Trending Picks</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <SuggestedProductCard
            key={product.id}
            product={product}
            index={index}
            onClick={() => navigate(`/product/${product.id}`)}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </div>
  );
}

// Suggested Product Card Component
const SuggestedProductCard = ({ product, index, onClick, formatPrice }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = product.imageUrl && product.imageUrl.trim() !== "";
  const isLowStock = product.quantity > 0 && product.quantity <= 5;
  const isOutOfStock = product.quantity === 0;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Trending Badge */}
      {product.isTrending && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          HOT
        </div>
      )}

      {/* Stock Badge */}
      {isOutOfStock && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
          Out of Stock
        </div>
      )}

      {/* Image Container */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-56 overflow-hidden">
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.style.display = "none";
              }}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <button className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium text-sm">
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors leading-snug"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
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
          <span className="text-xs font-medium text-gray-600">
            {product.rating ? product.rating.toFixed(1) : "0.0"}
          </span>
          {product.ratingCount > 0 && (
            <span className="text-xs text-gray-400">
              ({product.ratingCount})
            </span>
          )}
        </div>

        {/* Price and Stock */}
        <div className="space-y-2">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </div>

          {/* Stock Status */}
          {isLowStock && (
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
              Only {product.quantity} left!
            </div>
          )}

          {!isOutOfStock && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              In Stock
            </div>
          )}
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
    </div>
  );
};

// Add keyframes for fade in animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default SuggestedProducts;
