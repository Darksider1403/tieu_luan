import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Edit2, Save, X } from "lucide-react";
import { accountService } from "../services/accountService";
import Toast from "./Toast";

function UserPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    numberPhone: "",
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = accountService.getUser();
    if (!userData) {
      navigate("/login");
      return;
    }

    setUser(userData);
    setFormData({
      fullname: userData.fullname || "",
      email: userData.email || "",
      numberPhone: userData.numberPhone || "",
    });
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      // Add your update profile API call here
      // await accountService.updateProfile(formData);

      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setIsEditing(false);
      setToast({
        message: "Profile updated successfully!",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Failed to update profile",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      fullname: user.fullname || "",
      email: user.email || "",
      numberPhone: user.numberPhone || "",
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-purple-600" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {user?.fullname || user?.username}
                </h1>
                <p className="text-purple-100">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Username (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{user?.username}</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      className="flex-1 bg-transparent border-none focus:outline-none text-gray-900"
                    />
                  ) : (
                    <span className="text-gray-600">{user?.fullname}</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{user?.email}</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      name="numberPhone"
                      value={formData.numberPhone}
                      onChange={handleChange}
                      className="flex-1 bg-transparent border-none focus:outline-none text-gray-900"
                    />
                  ) : (
                    <span className="text-gray-600">
                      {user?.numberPhone || "Not provided"}
                    </span>
                  )}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.role === "Admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user?.role || "User"}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate("/settings", { state: { activeTab: "security" } })}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPage;
