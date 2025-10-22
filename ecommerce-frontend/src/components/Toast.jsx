import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

function Toast({ message, type = "success", duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Match animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const icon =
    type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />;
  const iconColor = type === "success" ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`fixed top-4 right-4 border ${bgColor} rounded-lg shadow-lg p-4 max-w-sm flex items-start gap-3 z-50 transition-all duration-300 ${
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
    >
      <div className={`${iconColor} flex-shrink-0`}>{icon}</div>
      <div className={`${textColor} text-sm font-medium flex-1`}>{message}</div>
      <button
        onClick={handleClose}
        className={`${textColor} hover:opacity-70 flex-shrink-0`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
