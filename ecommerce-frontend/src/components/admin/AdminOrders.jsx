import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Download,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  X,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  ShoppingBag,
  ArrowUpDown,
  Truck,
  FileText,
} from "lucide-react";
import apiClient from "../../services/apiService";
import Toast from "../Toast";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [allOrders, statusFilter, searchTerm, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/order/all");
      const ordersData = response.data || [];
      setAllOrders(ordersData);

      // Calculate statistics
      const pending = ordersData.filter((o) => o.status === 0).length;
      const completed = ordersData.filter((o) => o.status === 1).length;
      const cancelled = ordersData.filter((o) => o.status === 2).length;
      const revenue = ordersData
        .filter((o) => o.status === 1)
        .reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0);

      setStats({
        total: ordersData.length,
        pending,
        completed,
        cancelled,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      setToast({
        message: "Failed to load orders",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...allOrders];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.status === parseInt(statusFilter)
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id?.toString().includes(term) ||
          order.fullname?.toLowerCase().includes(term) ||
          order.numberPhone?.includes(term) ||
          order.address?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.dateBuy) - new Date(a.dateBuy);
        case "date-asc":
          return new Date(a.dateBuy) - new Date(b.dateBuy);
        case "price-desc":
          return parseFloat(b.totalPrice) - parseFloat(a.totalPrice);
        case "price-asc":
          return parseFloat(a.totalPrice) - parseFloat(b.totalPrice);
        case "id-desc":
          return b.id - a.id;
        case "id-asc":
          return a.id - b.id;
        default:
          return 0;
      }
    });

    setOrders(filtered);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/order/${orderId}/status`, { status: newStatus });
      setToast({
        message: "Order status updated successfully",
        type: "success",
      });
      fetchOrders();
    } catch (error) {
      setToast({
        message: "Failed to update order status",
        type: "error",
      });
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setLoadingDetails(true);

    try {
      // Fetch order details with items
      const response = await apiClient.get(`/order/${order.id}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Use the basic order info if detailed fetch fails
      setOrderDetails(order);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      0: {
        label: "Pending",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
        dotColor: "bg-amber-500",
      },
      1: {
        label: "Completed",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
        dotColor: "bg-emerald-500",
      },
      2: {
        label: "Cancelled",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
        dotColor: "bg-red-500",
      },
    };
    return configs[status] || configs[0];
  };

  const StatCard = ({ icon: Icon, title, value, color, subValue }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage customer orders
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-sm">
          <Download className="w-5 h-5" />
          <span className="font-medium">Export Orders</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          title="Total Orders"
          value={stats.total}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          subValue={`${formatPrice(stats.totalRevenue)} revenue`}
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pending}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          subValue="Awaiting processing"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={stats.completed}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
          subValue="Successfully delivered"
        />
        <StatCard
          icon={XCircle}
          title="Cancelled"
          value={stats.cancelled}
          color="bg-gradient-to-br from-red-500 to-rose-600"
          subValue="Order cancelled"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "All", count: stats.total },
              { value: "0", label: "Pending", count: stats.pending },
              { value: "1", label: "Completed", count: stats.completed },
              { value: "2", label: "Cancelled", count: stats.cancelled },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === filter.value
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    statusFilter === filter.value
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Highest Value</option>
              <option value="price-asc">Lowest Value</option>
              <option value="id-desc">ID: High to Low</option>
              <option value="id-asc">ID: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
                      <p className="text-gray-500 text-sm">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-purple-600">
                              #{order.id}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.items?.length || "N/A"} items
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.fullname || "Guest"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.numberPhone || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {order.dateBuy
                              ? new Date(order.dateBuy).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 ml-6">
                          {order.dateBuy
                            ? new Date(order.dateBuy).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            order.paymentMethod === "vnpay" ||
                            order.paymentMethod === "banking"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {order.paymentMethod === "vnpay"
                            ? "VNPay"
                            : order.paymentMethod === "banking"
                            ? "Banking"
                            : "COD"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              parseInt(e.target.value)
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.color} focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer`}
                        >
                          <option value={0}>⏳ Pending</option>
                          <option value={1}>✅ Completed</option>
                          <option value={2}>❌ Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No orders found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Try adjusting your search or filter
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {orders.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{orders.length}</span> of{" "}
              <span className="font-medium">{allOrders.length}</span> orders
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Order #{selectedOrder.id}
                </h3>
                <p className="text-purple-200 text-sm mt-0.5">
                  {formatDate(selectedOrder.dateBuy)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                  setOrderDetails(null);
                }}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              {loadingDetails ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading order details...</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        getStatusConfig(selectedOrder.status).color
                      }`}
                    >
                      {React.createElement(
                        getStatusConfig(selectedOrder.status).icon,
                        { className: "w-4 h-4" }
                      )}
                      {getStatusConfig(selectedOrder.status).label}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(selectedOrder.totalPrice)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.fullname || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone Number</p>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.numberPhone || "N/A"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Shipping Address
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      Payment Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.paymentMethod === "vnpay"
                            ? "VNPay"
                            : selectedOrder.paymentMethod === "banking"
                            ? "Bank Transfer"
                            : "Cash on Delivery"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <p className="font-medium text-green-600">Paid</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {orderDetails?.items && orderDetails.items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        Order Items ({orderDetails.items.length})
                      </h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {orderDetails.items.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-4 p-4 ${
                              index !== orderDetails.items.length - 1
                                ? "border-b border-gray-100"
                                : ""
                            }`}
                          >
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.thumbnailImage ? (
                                <img
                                  src={item.thumbnailImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {item.productName ||
                                  `Product #${item.idProduct}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Qty: {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(item.quantity * item.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(selectedOrder.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-purple-600 text-lg">
                        {formatPrice(selectedOrder.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  {selectedOrder.note && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 text-sm mb-1">
                        Customer Note
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        {selectedOrder.note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                  setOrderDetails(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                Track Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
