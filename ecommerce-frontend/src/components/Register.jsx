import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ShoppingBag,
  Star,
  Shield,
  Truck,
  Check,
  X,
  User,
  Mail,
  Phone,
  UserCheck,
  Lock,
  CheckCircle,
} from "lucide-react";

// Account service for API calls
const accountService = {
  register: async (userData) => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/account/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            fullname: userData.fullname,
            numberPhone: userData.numberPhone,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Network error occurred");
    }
  },
};

function Register() {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    numberPhone: "",
    username: "",
    password: "",
    repeatPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Password validation rules
  const passwordRules = [
    {
      key: "length",
      text: "At least 8 characters",
      test: (pwd) => pwd.length >= 8,
    },
    {
      key: "uppercase",
      text: "One uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      key: "lowercase",
      text: "One lowercase letter",
      test: (pwd) => /[a-z]/.test(pwd),
    },
    { key: "number", text: "One number", test: (pwd) => /\d/.test(pwd) },
    {
      key: "special",
      text: "One special character",
      test: (pwd) => /[@$!%*?&]/.test(pwd),
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Clear field-specific errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Real-time validation
    if (touchedFields[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "fullname":
        if (value && value.trim().length < 2) {
          error = "Full name must be at least 2 characters";
        }
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "numberPhone":
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          error = "Phone number must be 10-11 digits";
        }
        break;
      case "username":
        if (value && value.length < 3) {
          error = "Username must be at least 3 characters";
        } else if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
          error = "Username can only contain letters, numbers, and underscores";
        }
        break;
      case "repeatPassword":
        if (value && value !== formData.password) {
          error = "Passwords do not match";
        }
        break;
      default:
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return !error;
  };

  const isPasswordValid = () => {
    return passwordRules.every((rule) => rule.test(formData.password));
  };

  const isFormValid = () => {
    const requiredFields = [
      "fullname",
      "email",
      "numberPhone",
      "username",
      "password",
      "repeatPassword",
    ];
    const allFieldsFilled = requiredFields.every(
      (field) => formData[field].trim() !== ""
    );
    const noErrors = Object.values(fieldErrors).every((error) => !error);
    const passwordsMatch = formData.password === formData.repeatPassword;
    const passwordValid = isPasswordValid();

    return allFieldsFilled && noErrors && passwordsMatch && passwordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotify("");

    // Validate all fields
    const fieldsToValidate = [
      "fullname",
      "email",
      "numberPhone",
      "username",
      "password",
      "repeatPassword",
    ];
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field, formData[field])) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setLoading(false);
      return;
    }

    // Check passwords match
    if (formData.password !== formData.repeatPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        repeatPassword: "Passwords do not match",
      }));
      setLoading(false);
      return;
    }

    try {
      const response = await accountService.register({
        fullname: formData.fullname,
        email: formData.email,
        numberPhone: formData.numberPhone,
        username: formData.username,
        password: formData.password,
      });

      setNotify(
        "Registration successful! Please check your email for verification."
      );
      setFormData({
        fullname: "",
        email: "",
        numberPhone: "",
        username: "",
        password: "",
        repeatPassword: "",
      });
      setTouchedFields({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      fullname: User,
      email: Mail,
      numberPhone: Phone,
      username: UserCheck,
      password: Lock,
      repeatPassword: Lock,
    };
    return icons[fieldName] || User;
  };

  const isFieldValid = (fieldName) => {
    return (
      touchedFields[fieldName] && formData[fieldName] && !fieldErrors[fieldName]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex flex-col lg:flex-row min-h-[900px]">
              {/* Left Section - Benefits */}
              <div className="lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700"></div>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 p-12 text-white flex flex-col justify-center h-full">
                  {/* Logo/Brand */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold">FashionHub</h1>
                    </div>
                    <p className="text-white/90 text-lg">
                      Join thousands of fashion enthusiasts
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Exclusive Member Rewards
                        </h3>
                        <p className="text-white/80">
                          Get up to 30% off on premium brands and early access
                          to sales
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Free Express Shipping
                        </h3>
                        <p className="text-white/80">
                          Enjoy free 2-day shipping on all orders over $75
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Personal Style Consultation
                        </h3>
                        <p className="text-white/80">
                          Get personalized styling advice and 60-day return
                          guarantee
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-12 grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">50K+</div>
                      <div className="text-white/80 text-sm">
                        Happy Customers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">1000+</div>
                      <div className="text-white/80 text-sm">
                        Fashion Brands
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
                </div>
              </div>

              {/* Right Section - Register Form */}
              <div className="lg:w-1/2 p-12 flex flex-col justify-center">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
                  <a
                    href="/login"
                    className="flex-1 py-3 px-4 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-700 text-center"
                  >
                    Sign In
                  </a>
                  <button className="flex-1 py-3 px-4 text-sm font-medium rounded-lg bg-white text-gray-900 shadow-sm">
                    Sign Up
                  </button>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600">
                    Join FashionHub and start your style journey today
                  </p>
                </div>

                {/* Notifications */}
                {notify && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <p className="text-green-800 text-sm">{notify}</p>
                  </div>
                )}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                    <X className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Register Form */}
                <div className="space-y-6">
                  {/* Full Name and Username */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-12 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ${
                            fieldErrors.fullname
                              ? "border-red-300"
                              : isFieldValid("fullname")
                              ? "border-green-300"
                              : "border-gray-200"
                          }`}
                          placeholder="Enter your full name"
                          required
                        />
                        {isFieldValid("fullname") && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.fullname && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors.fullname}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserCheck className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-12 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ${
                            fieldErrors.username
                              ? "border-red-300"
                              : isFieldValid("username")
                              ? "border-green-300"
                              : "border-gray-200"
                          }`}
                          placeholder="Choose a username"
                          required
                        />
                        {isFieldValid("username") && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.username && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ${
                          fieldErrors.email
                            ? "border-red-300"
                            : isFieldValid("email")
                            ? "border-green-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Enter your email address"
                        required
                      />
                      {isFieldValid("email") && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="numberPhone"
                        value={formData.numberPhone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-10 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ${
                          fieldErrors.numberPhone
                            ? "border-red-300"
                            : isFieldValid("numberPhone")
                            ? "border-green-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Enter your phone number"
                        required
                      />
                      {isFieldValid("numberPhone") && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.numberPhone && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors.numberPhone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-600">
                            Password strength:
                          </span>
                          <div className="flex space-x-1">
                            {passwordRules.map((rule, index) => (
                              <div
                                key={rule.key}
                                className={`w-6 h-1 rounded ${
                                  rule.test(formData.password)
                                    ? "bg-green-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.key}
                            className="flex items-center space-x-2 text-sm"
                          >
                            {rule.test(formData.password) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                            <span
                              className={
                                rule.test(formData.password)
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {rule.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showRepeatPassword ? "text" : "password"}
                        name="repeatPassword"
                        value={formData.repeatPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ${
                          fieldErrors.repeatPassword
                            ? "border-red-300"
                            : isFieldValid("repeatPassword")
                            ? "border-green-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRepeatPassword(!showRepeatPassword)
                        }
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showRepeatPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      {isFieldValid("repeatPassword") && (
                        <div className="absolute inset-y-0 right-12 pr-2 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.repeatPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors.repeatPassword}
                      </p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-gray-600 leading-5"
                    >
                      I agree to the{" "}
                      <a
                        href="/terms"
                        className="text-purple-600 hover:text-purple-500 font-medium"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy"
                        className="text-purple-600 hover:text-purple-500 font-medium"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>

                {/* Footer Text */}
                <p className="text-xs text-gray-500 text-center mt-8 leading-relaxed">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-purple-600 hover:text-purple-500 font-medium"
                  >
                    Sign in here
                  </a>
                </p>

                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  By creating an account, you agree to receive promotional
                  emails. You can unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
