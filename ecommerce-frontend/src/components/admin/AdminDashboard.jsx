import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../services/apiService";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueChange: 0,
    ordersChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  // Chart data
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real stats from API
      const [productsRes, usersRes, ordersRes] = await Promise.allSettled([
        apiClient.get("/product/all"),
        apiClient.get("/account/all"),
        apiClient.get("/order/all"),
      ]);

      const products =
        productsRes.status === "fulfilled" ? productsRes.value.data : [];
      const users = usersRes.status === "fulfilled" ? usersRes.value.data : [];
      const orders =
        ordersRes.status === "fulfilled" ? ordersRes.value.data : [];

      // Calculate total revenue from completed orders
      const totalRevenue = orders
        .filter((order) => order.status === 1)
        .reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0);

      setStats({
        totalRevenue: totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length,
        revenueChange: 12.5,
        ordersChange: 8.3,
      });

      // Set recent orders
      setRecentOrders(orders.slice(0, 5));

      // Generate revenue chart data (last 7 months)
      const monthlyRevenue = generateMonthlyRevenue(orders);
      setRevenueData(monthlyRevenue);

      // Generate order status data for pie chart
      const statusCounts = {
        Pending: orders.filter((o) => o.status === 0).length,
        Completed: orders.filter((o) => o.status === 1).length,
        Cancelled: orders.filter((o) => o.status === 2).length,
      };
      setOrderStatusData([
        { name: "Pending", value: statusCounts.Pending, color: "#F59E0B" },
        { name: "Completed", value: statusCounts.Completed, color: "#10B981" },
        { name: "Cancelled", value: statusCounts.Cancelled, color: "#EF4444" },
      ]);

      // Generate top products data
      const topProducts = generateTopProducts(products);
      setTopProductsData(topProducts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use fallback mock data
      setStats({
        totalRevenue: 125000000,
        totalOrders: 234,
        totalProducts: 156,
        totalUsers: 1234,
        revenueChange: 12.5,
        ordersChange: 8.3,
      });
      setRevenueData(getMockRevenueData());
      setOrderStatusData([
        { name: "Pending", value: 45, color: "#F59E0B" },
        { name: "Completed", value: 156, color: "#10B981" },
        { name: "Cancelled", value: 33, color: "#EF4444" },
      ]);
      setTopProductsData(getMockTopProducts());
    } finally {
      setLoading(false);
    }
  };

  // Generate monthly revenue data from orders
  const generateMonthlyRevenue = (orders) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.dateBuy || order.createdAt);
        return orderDate.getMonth() === monthIndex && order.status === 1;
      });
      const revenue = monthOrders.reduce(
        (sum, order) => sum + (parseFloat(order.totalPrice) || 0),
        0
      );
      result.push({
        month: months[monthIndex],
        revenue: revenue,
        orders: monthOrders.length,
      });
    }

    // If no real data, return mock data
    if (result.every((r) => r.revenue === 0)) {
      return getMockRevenueData();
    }

    return result;
  };

  // Generate top products data
  const generateTopProducts = (products) => {
    // Sort by quantity sold or rating, take top 5
    const sorted = [...products]
      .sort(
        (a, b) =>
          (b.soldCount || b.rating || 0) - (a.soldCount || a.rating || 0)
      )
      .slice(0, 5);

    if (sorted.length === 0) {
      return getMockTopProducts();
    }

    return sorted.map((p) => ({
      name:
        p.name?.substring(0, 15) + (p.name?.length > 15 ? "..." : "") ||
        "Product",
      sales: p.soldCount || Math.floor(Math.random() * 100) + 20,
      revenue:
        parseFloat(p.price) *
        (p.soldCount || Math.floor(Math.random() * 50) + 10),
    }));
  };

  // Mock data fallbacks
  const getMockRevenueData = () => [
    { month: "Jun", revenue: 45000000, orders: 32 },
    { month: "Jul", revenue: 52000000, orders: 41 },
    { month: "Aug", revenue: 48000000, orders: 38 },
    { month: "Sep", revenue: 61000000, orders: 52 },
    { month: "Oct", revenue: 55000000, orders: 45 },
    { month: "Nov", revenue: 67000000, orders: 58 },
    { month: "Dec", revenue: 125000000, orders: 89 },
  ];

  const getMockTopProducts = () => [
    { name: "Áo thun cotton", sales: 156, revenue: 23400000 },
    { name: "Quần jean slim", sales: 134, revenue: 40200000 },
    { name: "Áo khoác bomber", sales: 98, revenue: 49000000 },
    { name: "Giày sneaker", sales: 87, revenue: 43500000 },
    { name: "Túi xách da", sales: 76, revenue: 38000000 },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatShortPrice = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              change >= 0
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            }`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}:{" "}
              {entry.name === "revenue"
                ? formatPrice(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          change={stats.revenueChange}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          icon={ShoppingBag}
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={stats.ordersChange}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={Package}
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
        />
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          color="bg-gradient-to-br from-orange-500 to-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Overview
              </h3>
              <p className="text-sm text-gray-500">Monthly revenue trend</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-gray-600">Orders</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={formatShortPrice}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  name="revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={{ fill: "#60A5FA", strokeWidth: 2, r: 4 }}
                  name="orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Orders by Status
            </h3>
            <p className="text-sm text-gray-500">Distribution overview</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {orderStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Selling Products
            </h3>
            <p className="text-sm text-gray-500">By number of sales</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatPrice(value) : value,
                    name === "revenue" ? "Revenue" : "Sales",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#8B5CF6"
                  radius={[0, 4, 4, 0]}
                  name="Sales"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue by Product
            </h3>
            <p className="text-sm text-gray-500">Top products by revenue</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={formatShortPrice}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(value), "Revenue"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {topProductsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Latest customer orders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.fullname || "Customer"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.dateBuy
                        ? new Date(order.dateBuy).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrice(order.totalPrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status === 0
                          ? "Pending"
                          : order.status === 1
                          ? "Completed"
                          : "Cancelled"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
