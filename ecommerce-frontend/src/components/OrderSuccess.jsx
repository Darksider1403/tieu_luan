import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Package, MapPin, CreditCard } from "lucide-react";
import { orderService } from "../services/orderService";

function OrderSuccess() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const data = await orderService.getOrderById(orderId);
      // Calculate total from order details if not provided by backend
      if (data.orderDetails && !data.totalAmount) {
        const subtotal = data.orderDetails.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        // Add shipping fee (30,000đ)
        data.totalAmount = subtotal + 30000;
      }
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-gray-600">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất.
            </p>
          </div>

          {order && (
            <div className="border-t border-gray-200 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold text-gray-900">#{order.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                  <p className="font-medium text-gray-900">
                    {order.address
                      ? order.address
                          .split(",")
                          .map((part) => part.trim())
                          .filter((part) => part)
                          .join(", ")
                      : "Không có địa chỉ"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">
                    Phương thức thanh toán
                  </p>
                  <p className="font-medium text-gray-900">
                    {order.paymentMethod === "COD" ||
                    order.paymentMethod === "Tiền mặt"
                      ? "Thanh toán khi nhận hàng"
                      : order.paymentMethod === "Bank Transfer" ||
                        order.paymentMethod === "Chuyển khoản"
                      ? "Chuyển khoản ngân hàng"
                      : order.paymentMethod || "Chưa xác định"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                {order.orderDetails && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Tiền hàng:</span>
                      <span>
                        {order.orderDetails
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span>30,000đ</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2"></div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-purple-600">
                    {order.totalAmount?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
