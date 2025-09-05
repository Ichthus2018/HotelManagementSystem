// src/pages/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserLock,
} from "react-icons/fa";
import reactLogo from "../../assets/react.svg";
const Login = () => {
  // --- Your existing state and logic ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- New state for UI enhancements ---
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.admin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
      // No need to navigate here; the useEffect will handle it.
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
        <div className="hidden md:block absolute top-0 left-0 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70"></div>
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-2000"></div>
        <div className="hidden md:block absolute bottom-0 left-1/2 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-4000"></div>
      </div>

      {/* Hero Section (for larger screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div
          className="absolute inset-0 bg-cover bg-center overflow-hidden shadow-2xl"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1470')", // A hotel/resort image that fits the blue theme
          }}
        />
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center w-full lg:w-1/2 relative z-10 p-2 md:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Login Form Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => navigate("/")}
              >
                <img
                  src={reactLogo}
                  alt="Logo"
                  className="w-14 h-14 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-2xl font-extrabold text-gray-800 tracking-tight">
                  Hotel Booking
                </span>
              </div>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaEnvelope className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
