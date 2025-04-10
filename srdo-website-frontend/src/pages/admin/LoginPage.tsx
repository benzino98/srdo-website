import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Test API connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await authService.testApiConnection();
        setConnectionStatus(
          result.status === "success" ? "Connected" : "Error"
        );
        if (result.status !== "success") {
          setError(result.message);
        }
      } catch (err: any) {
        setConnectionStatus("Error");
        setError(`API connection test failed: ${err.message}`);
      }
    };

    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", email);

      // First test the API connection
      try {
        const connectionTest = await authService.testApiConnection();
        if (connectionTest.status !== "success") {
          throw new Error(connectionTest.message);
        }
        console.log("API connection successful:", connectionTest.message);
      } catch (connectionError: any) {
        console.error("API connection test failed:", connectionError);
        setError(`Connection error: ${connectionError.message}`);
        setIsLoading(false);
        return;
      }

      // Try to login with credentials
      try {
        await login({ email, password });
        setSuccess("Login successful! Redirecting...");

        // Get redirect param from URL or use default
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/admin";

        // Handle from location state if available
        const locationState = location.state as { from?: string } | null;
        const fromPath = locationState?.from;

        // Determine target path with priority
        const targetPath = redirectPath || fromPath || "/admin";

        // Add a small delay to show success message
        setTimeout(() => {
          navigate(targetPath);
        }, 1000);
      } catch (loginError: any) {
        console.error("Login error details:", loginError);
        let errorMessage =
          "Login failed: " + (loginError.message || "Unknown error");

        // Check for specific error types
        if (errorMessage.includes("Network error")) {
          errorMessage =
            "Network error: Unable to connect to the authentication server. Please verify the backend is running.";
        } else if (errorMessage.includes("401")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (errorMessage.includes("CORS")) {
          errorMessage =
            "CORS error: The server is not allowing requests from this origin. Please check server configuration.";
        } else if (errorMessage.includes("500")) {
          errorMessage =
            "Server error: The authentication server encountered an error. Please check server logs.";
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login error details:", error);
      setError(
        error.message || "Failed to login. Please check your credentials."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <img
            src={`${process.env.PUBLIC_URL}/images/logo/srdo_logo.png`}
            alt="SRDO Logo"
            className="h-16 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the admin dashboard
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Connection Status */}
          {connectionStatus && (
            <div
              className={`mb-4 p-2 rounded text-sm ${
                connectionStatus === "Connected"
                  ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                  : "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500"
              }`}
            >
              <p>
                <strong>Server Status:</strong> {connectionStatus}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 bg-green-100 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || connectionStatus === "Error"}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isLoading || connectionStatus === "Error"
                    ? "opacity-75 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            {/* Debug information section */}
            {process.env.NODE_ENV !== "production" && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <div>
                  <strong>Debug Info:</strong>
                </div>
                <div>API URL: {process.env.REACT_APP_API_URL || "Not set"}</div>
                <div>Connection Status: {connectionStatus || "Unknown"}</div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
