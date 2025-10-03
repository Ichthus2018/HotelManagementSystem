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
import LogoStay from "../../assets/LogoStay";
import Logo from "../../assets/Logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
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
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden bg-gray-50">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -top-40 right-0 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>
        <div className="absolute -bottom-40 right-20 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-6000"></div>
      </div>

      {/* Main Container - Wider and more responsive */}
      <div className="flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-lg lg:max-w-2xl">
          {/* Enhanced Login Form Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 sm:p-10 lg:p-12 shadow-2xl border border-white/20">
            {/* Header Section */}
            <div className="flex flex-col items-center mb-8 lg:mb-10">
              <div className="text-center">
                <div className="flex justify-center mb-4 lg:mb-6">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-12 sm:h-16 lg:h-20 w-auto"
                  />
                </div>

                <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium">
                  Welcome Back
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center text-sm lg:text-base">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6 lg:space-y-8" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="relative group">
                <label className="block text-sm lg:text-base font-semibold text-gray-700 mb-2 lg:mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 lg:pl-4">
                    <FaEnvelope className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-300 text-sm lg:text-base shadow-sm hover:shadow-md"
                    placeholder="admin123@gmail.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm lg:text-base font-semibold text-gray-700 mb-2 lg:mb-3">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 lg:pl-4">
                    <FaLock className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-300 text-sm lg:text-base shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 lg:pr-4 text-gray-400 hover:text-blue-600 transition-colors duration-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 lg:h-5 lg:w-5" />
                    ) : (
                      <FaEye className="h-4 w-4 lg:h-5 lg:w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 lg:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 lg:py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm lg:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white mr-2 lg:mr-3"></div>
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
              <p className="text-xs text-gray-500">
                Powered by{" "}
                <span className="font-semibold">Ichthus Technology</span>
                {/* <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-300"
                >
                  Sign Up
                </Link> */}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animation delays */}
      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
};

export default Login;
