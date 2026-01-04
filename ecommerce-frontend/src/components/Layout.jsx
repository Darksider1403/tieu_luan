import React, { useState, useEffect } from "react";

import { cartService } from "../services/productService";
import { accountService } from "../services/accountService";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children, user }) => {
  const [cartSize, setCartSize] = useState(0);

  // Fetch cart size on component mount (only if authenticated)
  useEffect(() => {
    const fetchCartSize = async () => {
      // Only fetch cart size if user is authenticated
      if (!accountService.isAuthenticated()) {
        setCartSize(0);
        return;
      }

      try {
        const size = await cartService.getCartSize();
        setCartSize(size);
      } catch (error) {
        console.error("Failed to fetch cart size:", error);
        setCartSize(0);
      }
    };

    fetchCartSize();
  }, []);

  // Function to update cart size from child components
  const handleCartSizeUpdate = (newSize) => {
    setCartSize(newSize);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={user}
        cartSize={cartSize}
        onCartSizeUpdate={handleCartSizeUpdate}
      />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
