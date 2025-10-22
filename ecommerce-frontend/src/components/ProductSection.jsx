import { ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

const ProductSection = ({
  title,
  products,
  categoryImage,
  categoryId,
  onAddToCart,
}) => {
  // Debug: Show what we received
  console.log(`${title} - Products:`, products);

  if (!products || products.length === 0) {
    // Show a message instead of returning null (for debugging)
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No products available in this category yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

        <a
          href={`/products?category=${categoryId}`}
          className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <img
            src={categoryImage}
            alt={title}
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
        </div>

        <div className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSection;
