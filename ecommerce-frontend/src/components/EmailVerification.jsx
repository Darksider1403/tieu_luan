import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Loader, Mail, ArrowRight } from "lucide-react";

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const hasVerified = useRef(false); // Flag to prevent double verification

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent double verification
      if (hasVerified.current) {
        console.log("Verification already completed, skipping...");
        return;
      }
      
      hasVerified.current = true;

      try {
        // Get the verification code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          setVerificationStatus("error");
          setMessage("Verification code is missing from the URL.");
          return;
        }

        console.log("Starting email verification with code:", code);

        // Make API call to verify email
        const response = await fetch(
          `http://localhost:5001/api/account/verify-email?code=${code}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        console.log("Verification response:", { status: response.status, ok: response.ok, data });

        if (response.ok && data.success) {
          setVerificationStatus("success");
          setMessage(data.message || "Email verified successfully!");

          // Start countdown and redirect to home
          startCountdown();
        } else {
          setVerificationStatus("error");
          setMessage(
            data.error || "Email verification failed. Please try again."
          );
        }
      } catch (error) {
        setVerificationStatus("error");
        setMessage(
          "Network error occurred. Please check your connection and try again."
        );
        console.error("Verification error:", error);
      }
    };

    verifyEmail();
  }, []);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to home page
          window.location.href = "/home";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleManualRedirect = () => {
    window.location.href = "/home";
  };

  const handleLoginRedirect = () => {
    window.location.href = "/login";
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              Please wait while we verify your email address...
            </p>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                This should only take a moment.
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium mb-2">
                Welcome to FashionHub!
              </p>
              <p className="text-green-700 text-sm">
                Your account is now active and ready to use.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-600 text-sm mb-2">
                Redirecting to home page in{" "}
                <span className="font-bold text-purple-600">{countdown}</span>{" "}
                seconds...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={handleManualRedirect}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <span>Go to Home Page Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">
                The verification link may have expired or been used already.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02]"
              >
                Go to Login Page
              </button>

              <button
                onClick={() => (window.location.href = "/register")}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                Register Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">FashionHub</h1>
            </div>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact our support team at support@fashionhub.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
