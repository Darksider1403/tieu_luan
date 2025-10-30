import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";

function PaymentReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, success, failed
  const [message, setMessage] = useState("Đang xử lý thanh toán...");

  useEffect(() => {
    processPaymentReturn();
  }, []);

  const processPaymentReturn = async () => {
    try {
      // Get all query parameters
      const params = {};
      for (let [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      console.log("Payment return params:", params);

      // Check if it's MoMo payment
      if (params.partnerCode === "MOMO") {
        const resultCode = params.resultCode;
        const orderId = params.orderId;

        if (resultCode === "0") {
          setStatus("success");
          setMessage("Thanh toán thành công!");

          // Redirect to order success page after 2 seconds
          setTimeout(() => {
            navigate(`/order-success/${orderId}`);
          }, 2000);
        } else {
          setStatus("failed");
          setMessage(params.message || "Thanh toán thất bại");
        }
      }
      // Check if it's VNPay payment
      else if (params.vnp_TxnRef) {
        const responseCode = params.vnp_ResponseCode;
        const orderId = params.vnp_TxnRef;

        if (responseCode === "00") {
          setStatus("success");
          setMessage("Thanh toán thành công!");

          setTimeout(() => {
            navigate(`/order-success/${orderId}`);
          }, 2000);
        } else {
          setStatus("failed");
          setMessage("Thanh toán thất bại");
        }
      } else {
        setStatus("failed");
        setMessage("Không tìm thấy thông tin thanh toán");
      }
    } catch (error) {
      console.error("Error processing payment return:", error);
      setStatus("failed");
      setMessage("Có lỗi xảy ra khi xử lý thanh toán");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "processing" && (
          <>
            <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thành công!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Đang chuyển hướng...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thất bại</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/cart")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Quay lại giỏ hàng
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentReturn;
