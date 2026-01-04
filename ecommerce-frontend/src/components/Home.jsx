import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  Star,
  TrendingUp,
  Gift,
  Zap,
  ArrowRight,
  Mail,
} from "lucide-react";
import { productService } from "../services/productService";
import ImageCarousel from "./ImageCarousel";
import ProductSection from "./ProductSection";
import Toast from "./Toast";

const Home = () => {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState([]);
  const [productCategories, setProductCategories] = useState({
    category1: [],
    category2: [],
    category3: [],
    category4: [],
    category5: [],
  });
  const [loading, setLoading] = useState(true);
  const [cartSize, setCartSize] = useState(0);
  const [toast, setToast] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const slidersData = await productService.getSliders();
        setSliders(slidersData);

        const [cat1, cat2, cat3, cat4, cat5] = await Promise.all([
          productService.getProductsByCategory(1, 6), // Men's T-Shirts
          productService.getProductsByCategory(8, 6), // Women's Tops
          productService.getProductsByCategory(10, 6), // Women's Dresses
          productService.getProductsByCategory(13, 6), // Women's Accessories
          productService.getProductsByCategory(15, 6), // Men's Jackets
        ]);

        // Map products to ensure rating property is correctly named
        const normalizeRating = (products) => {
          return products.map((product) => {
            const fakeRating =
              product.averageRating || Math.random() * 1.5 + 3.5;

            return {
              ...product,
              rating: fakeRating,
            };
          });
        };

        setProductCategories({
          category1: normalizeRating(cat1),
          category2: normalizeRating(cat2),
          category3: normalizeRating(cat3),
          category4: normalizeRating(cat4),
          category5: normalizeRating(cat5),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      const result = await productService.addToCart(productId);
      if (result.success) {
        setCartSize(result.cartSize || cartSize + 1);
        setToast({
          message: "Product added to cart successfully!",
          type: "success",
        });
      }
    } catch (error) {
      setToast({
        message: "Failed to add product to cart. Please try again.",
        type: "error",
      });
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setToast({
        message: "Thanks for subscribing to our newsletter!",
        type: "success",
      });
      setEmail("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 absolute top-0 left-1/2 -translate-x-1/2"></div>
          </div>
          <p className="text-gray-600 font-medium">
            Loading fashion collections...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Curating the best styles for you
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  New Season Collection
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Discover Your
                <br />
                <span className="text-yellow-300">Perfect Style</span>
              </h1>
              <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-2xl">
                Explore our curated collection of premium fashion. Quality meets
                affordability in every piece.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button
                  onClick={() => navigate("/products")}
                  className="group px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-yellow-300 hover:text-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/30 hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Trending Items
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-32 h-32 text-white/80" />
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-purple-900 rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold">50%</div>
                    <div className="text-xs">OFF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Truck}
              title="Free Shipping"
              description="On orders over ₫500,000"
              color="bg-blue-500"
            />
            <FeatureCard
              icon={Shield}
              title="Secure Payment"
              description="100% secure transactions"
              color="bg-green-500"
            />
            <FeatureCard
              icon={CreditCard}
              title="Easy Returns"
              description="30-day return policy"
              color="bg-purple-500"
            />
            <FeatureCard
              icon={Star}
              title="Quality Guarantee"
              description="Premium quality products"
              color="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Carousel */}
      <main className="container mx-auto px-4 py-8">
        <ImageCarousel sliders={sliders} />

        {/* Special Offers Banner */}
        <div className="my-12 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-1">
                  Special Offer!
                </h3>
                <p className="text-orange-100">
                  Get up to 50% off on selected items this week
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-lg whitespace-nowrap"
            >
              Shop Deals
            </button>
          </div>
        </div>

        {/* Product Sections */}
        <div className="space-y-16">
          <ProductSection
            title="Men's T-Shirts"
            products={productCategories.category1}
            categoryImage="/product/mens-tshirts.jpg"
            categoryId={1}
            onAddToCart={handleAddToCart}
          />

          <ProductSection
            title="Women's Tops"
            products={productCategories.category2}
            categoryImage="/product/womens-tops.jpg"
            categoryId={8}
            onAddToCart={handleAddToCart}
          />

          <ProductSection
            title="Women's Dresses"
            products={productCategories.category3}
            categoryImage="/product/womens-dresses.jpg"
            categoryId={10}
            onAddToCart={handleAddToCart}
          />

          <ProductSection
            title="Women's Accessories"
            products={productCategories.category4}
            categoryImage="/product/womens-accessories.jpg"
            categoryId={13}
            onAddToCart={handleAddToCart}
          />

          <ProductSection
            title="Men's Jackets"
            products={productCategories.category5}
            categoryImage="/product/mens-jackets.jpg"
            categoryId={15}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Newsletter Section */}
        <div className="mt-20 mb-12">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-16">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                  <Mail className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Subscribe to Our Newsletter
                </h2>
                <p className="text-purple-100 text-lg mb-8">
                  Get exclusive deals, new arrivals, and fashion tips delivered
                  to your inbox
                </p>
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-6 py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-purple-200 focus:outline-none focus:border-white/50 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-yellow-300 hover:text-purple-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Subscribe Now
                  </button>
                </form>
                <p className="text-purple-200 text-sm mt-4">
                  No spam, unsubscribe anytime
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="my-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Trusted by Thousands
            </h2>
            <p className="text-gray-500">
              Join our growing community of fashion lovers
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <TrustStat number="10K+" label="Happy Customers" />
            <TrustStat number="500+" label="Products" />
            <TrustStat number="4.8" label="Average Rating" icon={Star} />
            <TrustStat number="24/7" label="Support" />
          </div>
        </div>
      </main>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200">
    <div className="flex items-start gap-4">
      <div
        className={`${color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

// Trust Stat Component
const TrustStat = ({ number, label, icon: Icon }) => (
  <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2 flex items-center justify-center gap-2">
      {number}
      {Icon && <Icon className="w-6 h-6 fill-current" />}
    </div>
    <div className="text-gray-600 font-medium">{label}</div>
  </div>
);

export default Home;
