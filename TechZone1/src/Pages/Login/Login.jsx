import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../Pages/AuthContextYoussef/AuthContextYoussef";
import { API_URL } from "../../config";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams(); // For reset-password
  const { signUp, signIn, forgotPassword, resetPassword, verifyEmail, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    newPassword: "",
    repassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Determine the current mode based on the URL path
  const mode = location.pathname.includes("signup")
    ? "signup"
    : location.pathname.includes("forgot-password")
    ? "forgot-password"
    : location.pathname.includes("reset-password")
    ? "reset-password"
    : "login";

  useEffect(() => {
    // If on reset-password route, check for token
    if (mode === "reset-password" && !token) {
      setError("Reset token is missing");
    }
  }, [mode, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      let result;
      if (mode === "signup") {
        if (formData.password !== formData.repassword) {
          throw new Error("Passwords don't match!");
        }
        if (!formData.displayName.trim()) {
          throw new Error("Display name cannot be empty");
        }
        result = await signUp(formData.email, formData.password, formData.displayName);
      } else if (mode === "login") {
        result = await signIn(formData.email, formData.password);
      } else if (mode === "forgot-password") {
        result = await forgotPassword(formData.email);
      } else if (mode === "reset-password") {
        result = await resetPassword(token, formData.newPassword);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setMessage(result.message || "Success!");
      if (mode === "login") {
        navigate("/dashboard");
      } else if (mode === "signup") {
        navigate("/check-email");
      } else if (mode === "forgot-password" || mode === "reset-password") {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/google_login`; // Redirect to Flask OAuth endpoint
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {mode === "signup" && "Create an Account"}
          {mode === "login" && "Welcome Back!"}
          {mode === "forgot-password" && "Forgot Password"}
          {mode === "reset-password" && "Reset Password"}
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              type="text"
              name="displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={handleChange}
              required
              disabled={authLoading}
            />
          )}
          {(mode === "signup" || mode === "login" || mode === "forgot-password") && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={authLoading}
            />
          )}
          {(mode === "signup" || mode === "login") && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={authLoading}
            />
          )}
          {mode === "signup" && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              type="password"
              name="repassword"
              placeholder="Confirm your password"
              value={formData.repassword}
              onChange={handleChange}
              required
              disabled={authLoading}
            />
          )}
          {mode === "reset-password" && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              disabled={authLoading}
            />
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-900 text-white font-semibold py-3 rounded-lg hover:from-[#1D267D] hover:to-[#004AAD] transition duration-300 shadow-md disabled:opacity-50"
              disabled={authLoading}
            >
              {authLoading ? "Processing..." : mode === "signup" ? "Sign Up" : mode === "login" ? "Sign In" : mode === "forgot-password" ? "Send Reset Link" : "Reset Password"}
            </button>

            {mode === "login" && (
              <button
                type="button"
                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                onClick={() => navigate("/signup")}
                disabled={authLoading}
              >
                Create Account
              </button>
            )}
            {mode === "signup" && (
              <button
                type="button"
                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                onClick={() => navigate("/login")}
                disabled={authLoading}
              >
                Back to Login
              </button>
            )}
            {(mode === "forgot-password" || mode === "reset-password") && (
              <button
                type="button"
                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                onClick={() => navigate("/login")}
                disabled={authLoading}
              >
                Back to Login
              </button>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition duration-300 shadow-sm disabled:opacity-50"
              disabled={authLoading}
              onClick={handleGoogleLogin}
            >
              <FcGoogle size={20} />
              Sign in with Google
            </button>
          </div>

          <div className="mt-4 text-center">
            {mode === "login" && (
              <p className="text-gray-500 text-sm">
                Forgot your password?{" "}
                <Link to="/forgot-password" className="text-indigo-600 font-medium hover:underline">
                  Reset it
                </Link>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-gray-500 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;