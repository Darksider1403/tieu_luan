import React, { useState, useEffect } from "react";
import { productService } from "../services/productService";
import ImageCarousel from "./ImageCarousel";
import ProductSection from "./ProductSection";

const Home = () => {
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

        setProductCategories({
          category1: cat1,
          category2: cat2,
          category3: cat3,
          category4: cat4,
          category5: cat5,
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
        alert("Product added to cart successfully!");
      }
    } catch (error) {
      alert("Failed to add product to cart. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fashion collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <ImageCarousel sliders={sliders} />

        <div className="space-y-12">
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
      </main>
    </div>
  );
};

export default Home;
