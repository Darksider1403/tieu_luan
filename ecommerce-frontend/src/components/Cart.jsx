import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import { cartService } from "../services/cartService";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const data = await cartService.getCartItems();
      setCartItems(data);
    } catch (err) {
      setError("Failed to fetch cart items");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, action) => {
    try {
      const item = cartItems.find((item) => item.productId === productId);
      if (!item) return;

      let newQuantity = item.quantity;
      if (action === "increase") {
        newQuantity += 1;
      } else if (action === "decrease" && newQuantity > 1) {
        newQuantity -= 1;
      } else if (action === "decrease" && newQuantity === 1) {
        return;
      }

      // Update locally for immediate UI feedback
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );

      // Sync with backend
      try {
        const response = await cartService.updateQuantity(
          productId,
          newQuantity
        );

        if (!response.success) {
          // Revert to previous quantity if backend update fails
          setCartItems(
            cartItems.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity }
                : item
            )
          );
          setError("Failed to update quantity");
        }
      } catch (backendError) {
        // Revert to previous quantity if backend call fails
        setCartItems(
          cartItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity }
              : item
          )
        );
        setError("Failed to update quantity. Please try again.");
        console.error("Error updating quantity on backend:", backendError);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("An error occurred");
    }
  };
  const removeFromCart = async (productId) => {
    await cartService.removeFromCart(productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const addToCart = async (productId) => {
    await cartService.addToCart(productId, 1);
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-6">Giỏ hàng của bạn trống</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <>
            {/* Cart Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Hình ảnh
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Mã SP
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Thành tiền
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr
                      key={item.productId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="max-w-xs">{item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={item.thumbnailImage}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.productId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.price?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 border border-gray-300 rounded w-fit">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, "decrease")
                            }
                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            disabled
                            className="w-12 text-center border-0 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, "increase")
                            }
                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {(item.price * item.quantity)?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total and Checkout */}
            <div className="flex flex-col items-end gap-6">
              <div className="bg-white rounded-lg shadow p-6 w-full md:w-64">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng cộng:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Thanh toán
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
