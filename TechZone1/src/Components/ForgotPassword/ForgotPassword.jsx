import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase"; // Adjust this path based on your project structure

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Call Firebase function to send password reset email
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setSuccessMessage("Recovery code has been sent to your email");
        setError(""); // Clear any previous error messages
        setEmail(""); // Reset email input field
      })
      .catch((err) => {
        setError(err.message); // Display Firebase error message
        setSuccessMessage(""); // Clear success message if there's an error
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Forget Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter the email address or mobile phone number associated with your
          account.
        </p>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear errors on input change
                setSuccessMessage(""); // Clear success message on input change
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            SEND CODE
          </button>

          <div className="space-y-2">
            <div className="text-sm">
              Already have account?{" "}
              <Link to="/" className="text-blue-500 hover:text-blue-600">
                Sign In
              </Link>
            </div>
            <div className="text-sm">
              Don't have account?{" "}
              <Link to="/signup" className="text-blue-500 hover:text-blue-600">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            You may contact{" "}
            <Link
              to="/customer-service"
              className="text-orange-500 hover:text-orange-600"
            >
              Customer Service
            </Link>{" "}
            for help restoring access to your account.
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
