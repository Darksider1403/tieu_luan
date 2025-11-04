import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard, MapPin, User } from "lucide-react";
import { cartService } from "../services/cartService";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import Toast from "./Toast";

function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Address data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    notes: "",
    paymentMethod: "COD",
  });

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartService.getCartItems();

      if (!data || data.length === 0) {
        setToast({
          message:
            "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.",
          type: "error",
        });
        setTimeout(() => navigate("/cart"), 2000);
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setToast({
        message: "Không thể tải giỏ hàng",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchProvinces = useCallback(async () => {
    try {
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      setToast({
        message: "Không thể tải danh sách tỉnh/thành phố",
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    fetchCartItems();
    fetchProvinces();
  }, [fetchCartItems, fetchProvinces]);

  const handleProvinceChange = async (e) => {
    const selectedId = e.target.value;
    const selectedProvince = provinces.find((p) => p.id === selectedId);

    setFormData({
      ...formData,
      provinceCode: selectedId,
      provinceName: selectedProvince?.name || "",
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
    });

    setDistricts([]);
    setWards([]);

    if (selectedId) {
      setLoadingDistricts(true);
      const districtData = await addressService.getDistricts(selectedId);
      setDistricts(districtData);
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (e) => {
    const selectedId = e.target.value;
    const selectedDistrict = districts.find((d) => d.id === selectedId);

    setFormData({
      ...formData,
      districtCode: selectedId,
      districtName: selectedDistrict?.name || "",
      wardCode: "",
      wardName: "",
    });

    setWards([]);

    if (selectedId) {
      setLoadingWards(true);
      const wardData = await addressService.getWards(selectedId);
      setWards(wardData);
      setLoadingWards(false);
    }
  };

  const handleWardChange = (e) => {
    const selectedId = e.target.value;
    const selectedWard = wards.find((w) => w.id === selectedId);

    setFormData({
      ...formData,
      wardCode: selectedId,
      wardName: selectedWard?.name || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const calculateShipping = () => {
    return 30000; // 30,000 VND flat rate
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateShipping();
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setToast({ message: "Vui lòng nhập họ tên", type: "error" });
      return false;
    }
    if (!formData.phone.trim()) {
      setToast({ message: "Vui lòng nhập số điện thoại", type: "error" });
      return false;
    }
    const phoneRegex = /^[\d]{10,11}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setToast({ message: "Số điện thoại không hợp lệ", type: "error" });
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setToast({ message: "Email không hợp lệ", type: "error" });
      return false;
    }
    if (!formData.address.trim()) {
      setToast({ message: "Vui lòng nhập địa chỉ", type: "error" });
      return false;
    }
    if (!formData.provinceCode) {
      setToast({ message: "Vui lòng chọn tỉnh/thành phố", type: "error" });
      return false;
    }
    if (!formData.districtCode) {
      setToast({ message: "Vui lòng chọn quận/huyện", type: "error" });
      return false;
    }
    if (!formData.wardCode) {
      setToast({ message: "Vui lòng chọn phường/xã", type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const orderData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.provinceName,
        district: formData.districtName,
        ward: formData.wardName,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: calculateGrandTotal(),
        shippingFee: calculateShipping(),
      };

      const orderResponse = await orderService.createOrder(orderData);

      if (orderResponse.success) {
        const orderId = orderResponse.orderId;

        if (formData.paymentMethod === "VNPAY") {
          const paymentRequest = {
            orderId: orderId,
            amount: calculateGrandTotal(),
            paymentMethod: "VNPAY",
            returnUrl: `${window.location.origin}/payment-return`,
          };

          const paymentResponse = await orderService.createPayment(
            paymentRequest
          );

          if (paymentResponse.success) {
            await cartService.clearCart();
            window.location.href = paymentResponse.paymentUrl;
          } else {
            setToast({
              message: "Không thể tạo thanh toán VNPay",
              type: "error",
            });
          }
        } else if (formData.paymentMethod === "MOMO") {
          const paymentRequest = {
            orderId: orderId,
            amount: calculateGrandTotal(),
            paymentMethod: "MOMO",
            returnUrl: `${window.location.origin}/payment-return`,
          };

          const paymentResponse = await orderService.createMoMoPayment(
            paymentRequest
          );

          if (paymentResponse.success) {
            await cartService.clearCart();
            window.location.href = paymentResponse.paymentUrl;
          } else {
            setToast({
              message: "Không thể tạo thanh toán MoMo",
              type: "error",
            });
          }
        } else {
          await cartService.clearCart();
          navigate(`/order-success/${orderId}`);
        }
      } else {
        setToast({
          message: orderResponse.error || "Đặt hàng thất bại",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setToast({
        message:
          error.response?.data?.error || "Đặt hàng thất bại. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin khách hàng
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Địa chỉ giao hàng
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.provinceCode}
                      onChange={handleProvinceChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map((province) => (
                        <option
                          key={province.id}
                          value={province.id.toString()}
                        >
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.districtCode}
                      onChange={handleDistrictChange}
                      disabled={!formData.provinceCode || loadingDistricts}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    >
                      <option value="">
                        {loadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
                      </option>
                      {districts.map((district) => (
                        <option
                          key={district.id}
                          value={district.id.toString()}
                        >
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.wardCode}
                      onChange={handleWardChange}
                      disabled={!formData.districtCode || loadingWards}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    >
                      <option value="">
                        {loadingWards ? "Đang tải..." : "Chọn phường/xã"}
                      </option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id.toString()}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Ghi chú về đơn hàng (tùy chọn)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === "COD"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="ml-3">
                      <span className="text-gray-900 font-medium">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      <p className="text-sm text-gray-500">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MOMO"
                      checked={formData.paymentMethod === "MOMO"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <span className="text-gray-900 font-medium">Ví MoMo</span>
                      <img
                        src="https://static.momocdn.net/app/img/payment/logo.png"
                        alt="MoMo"
                        className="h-6"
                      />
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={formData.paymentMethod === "VNPAY"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <span className="text-gray-900 font-medium">VNPay</span>
                      <img
                        src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png"
                        alt="VNPay"
                        className="h-6"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Đơn hàng ({cartItems.length} sản phẩm)
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.thumbnailImage}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="text-gray-900">
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="text-gray-900">
                    {calculateShipping().toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Tổng cộng</span>
                  <span className="text-purple-600">
                    {calculateGrandTotal().toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang xử lý..." : "Đặt hàng"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="w-full mt-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors"
              >
                Quay lại giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
