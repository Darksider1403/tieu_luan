import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";

// Product Image Component with fallback
function ProductImage({ src, alt }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <Package className="w-8 h-8 text-gray-400" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [productInfo, setProductInfo] = useState({}); // Store product details

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getUserOrders();
      // Sort by date (newest first)
      const sortedOrders = data.sort(
        (a, b) => new Date(b.dateBuy) - new Date(a.dateBuy)
      );
      setOrders(sortedOrders);

      // Fetch product info for all products in orders
      const productIds = new Set();
      sortedOrders.forEach((order) => {
        if (order.orderDetails) {
          order.orderDetails.forEach((item) => {
            productIds.add(item.idProduct);
          });
        }
      });

      // Fetch product details (name and images)
      const productData = {};
      for (const productId of productIds) {
        try {
          const [product, images] = await Promise.all([
            productService.getProduct(productId),
            productService.getProductImages(productId),
          ]);
          productData[productId] = {
            name: product.name,
            thumbnail: images["0"] || null, // First image as thumbnail
          };
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          productData[productId] = {
            name: `Sản phẩm #${productId}`,
            thumbnail: null,
          };
        }
      }
      setProductInfo(productData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      // Refresh orders list
      await fetchOrders();
    } catch (error) {
      console.error("Error canceling order:", error);
      alert("Không thể hủy đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      0: {
        label: "Chờ xác nhận",
        color: "text-yellow-600 bg-yellow-50",
        icon: Clock,
      },
      1: {
        label: "Đã xác nhận",
        color: "text-blue-600 bg-blue-50",
        icon: Package,
      },
      2: {
        label: "Đang giao hàng",
        color: "text-purple-600 bg-purple-50",
        icon: Truck,
      },
      3: {
        label: "Đã giao",
        color: "text-green-600 bg-green-50",
        icon: CheckCircle,
      },
      4: {
        label: "Hoàn thành",
        color: "text-green-700 bg-green-100",
        icon: CheckCircle,
      },
      5: {
        label: "Đã hủy",
        color: "text-red-600 bg-red-50",
        icon: XCircle,
      },
    };

    return statusMap[status] || statusMap[0];
  };

  const calculateOrderTotal = (orderDetails) => {
    if (!orderDetails || orderDetails.length === 0) return 30000; // Only shipping fee
    const subtotal = orderDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal + 30000; // Add shipping fee
  };

  const canCancelOrder = (status) => {
    // Can only cancel if order is pending (0) or confirmed (1)
    return status === 0 || status === 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Đơn hàng của tôi
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi các đơn hàng của bạn
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-gray-500 mb-6">
              Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Mã đơn hàng</p>
                          <p className="font-semibold text-gray-900">
                            #{order.id}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div>
                          <p className="text-sm text-gray-500">Ngày đặt</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.dateBuy).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    {/* Products */}
                    {order.orderDetails && order.orderDetails.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {order.orderDetails.slice(0, 2).map((item, index) => {
                          const product = productInfo[item.idProduct];

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-4 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                              onClick={() =>
                                navigate(`/product/${item.idProduct}`)
                              }
                            >
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                <ProductImage
                                  src={product?.thumbnail}
                                  alt={
                                    product?.name || `Product ${item.idProduct}`
                                  }
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {product?.name ||
                                    `Sản phẩm #${item.idProduct}`}
                                </p>
                                <p className="text-gray-500">
                                  Số lượng: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-gray-900">
                                  {(item.price * item.quantity).toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {order.orderDetails.length > 2 && (
                          <p className="text-sm text-gray-500 italic">
                            và {order.orderDetails.length - 2} sản phẩm khác...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">
                        Địa chỉ giao hàng
                      </p>
                      <p className="text-sm text-gray-900">
                        {order.address
                          ? order.address
                              .split(",")
                              .map((part) => part.trim())
                              .filter((part) => part)
                              .join(", ")
                          : "Chưa có địa chỉ"}
                      </p>
                      {order.numberPhone && (
                        <p className="text-sm text-gray-600 mt-1">
                          SĐT: {order.numberPhone}
                        </p>
                      )}
                    </div>

                    {/* Total and Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="text-xl font-bold text-purple-600">
                          {calculateOrderTotal(
                            order.orderDetails
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/order-success/${order.id}`)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </button>

                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingOrderId === order.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                Đang hủy...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Hủy đơn
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
