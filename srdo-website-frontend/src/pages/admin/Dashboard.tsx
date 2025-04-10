import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

interface DashboardStats {
  projects_count: number;
  news_count: number;
  resources_count: number;
  contacts_count: number;
  unread_contacts: number;
}

const AdminDashboard: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");
  const [stats, setStats] = useState<DashboardStats>({
    projects_count: 0,
    news_count: 0,
    resources_count: 0,
    contacts_count: 0,
    unread_contacts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi<DashboardStats>();
  const { isAuthenticated, user } = useAuth();

  // Function to fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      if (!isAuthenticated) {
        console.error("User is not authenticated");
        setError("Please log in to view dashboard statistics");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("srdo_token");

      // Use API_URL constant to ensure we're using the correct endpoint
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

      const response = await get("/dashboard/stats");

      if (response) {
        // Case 1: Response has a nested data structure (common Laravel API pattern)
        if (
          response.data &&
          typeof response.data === "object" &&
          "data" in response.data
        ) {
          const nestedData = response.data.data as any;

          if (nestedData && typeof nestedData === "object") {
            setStats({
              projects_count: parseInt(nestedData.projects_count) || 0,
              news_count: parseInt(nestedData.news_count) || 0,
              resources_count: parseInt(nestedData.resources_count) || 0,
              contacts_count: parseInt(nestedData.contacts_count) || 0,
              unread_contacts: parseInt(nestedData.unread_contacts) || 0,
            });
          }
        }
        // Case 2: Response has a direct data property with stats
        else if (response.data && typeof response.data === "object") {
          const data = response.data as any;
          setStats({
            projects_count: parseInt(data.projects_count) || 0,
            news_count: parseInt(data.news_count) || 0,
            resources_count: parseInt(data.resources_count) || 0,
            contacts_count: parseInt(data.contacts_count) || 0,
            unread_contacts: parseInt(data.unread_contacts) || 0,
          });
        }
        // Case 3: Response is itself the stats object
        else if (typeof response === "object" && response !== null) {
          const directData = response as any;
          setStats({
            projects_count: parseInt(directData.projects_count) || 0,
            news_count: parseInt(directData.news_count) || 0,
            resources_count: parseInt(directData.resources_count) || 0,
            contacts_count: parseInt(directData.contacts_count) || 0,
            unread_contacts: parseInt(directData.unread_contacts) || 0,
          });
        } else {
          console.error("Unable to extract stats data from response");
          throw new Error(
            "Invalid response format - cannot extract stats data"
          );
        }

        setError(null);
      } else {
        console.error("Invalid response - response is null or undefined");
        throw new Error(
          "Invalid response format - response is null or undefined"
        );
      }
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics");

      // Keep existing stats rather than resetting to 0
      setStats((prevStats) => ({
        ...prevStats,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Function to check server status that can be called manually
  const checkServerStatus = async () => {
    setServerStatus("checking");

    try {
      // Get the full API URL with or without /v1 as configured in environment
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

      // Try the ping endpoint without adding another /v1
      await axios.get(`${API_URL}/ping`, {
        timeout: 8000,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      setServerStatus("online");

      // Also fetch the dashboard stats
      await fetchDashboardStats();
    } catch (err) {
      console.error("Backend server appears to be offline:", err);
      setServerStatus("offline");
    }
  };

  // Check server status and fetch stats on component mount
  useEffect(() => {
    checkServerStatus();

    // Set up a periodic refresh of the stats every 60 seconds when the dashboard is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboardStats();
      }
    }, 60000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Add a refresh button to the system status section
  const SystemStatusCard = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
        <button
          onClick={() => {
            setLoading(true);
            checkServerStatus();
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          disabled={loading || serverStatus === "checking"}
        >
          <svg
            className={`w-4 h-4 mr-1 ${
              loading || serverStatus === "checking" ? "animate-spin" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full mr-2 ${
                serverStatus === "online"
                  ? "bg-green-500"
                  : serverStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
            ></div>
            <span className="font-medium">
              Backend API:{" "}
              {serverStatus === "checking"
                ? "Checking connection..."
                : serverStatus === "online"
                ? "Connected"
                : "Offline"}
            </span>
          </div>
        </div>

        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

        <div className="mt-2 text-xs text-gray-500">
          Last checked: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        <AdminPageHeader
          title="Admin Dashboard"
          description="Manage website content and view analytics"
        />

        {serverStatus === "offline" && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="font-medium">
                Backend server appears to be offline. You are in offline mode.
              </p>
            </div>
            <p className="mt-2">
              You can still create content locally, which will be saved in your
              browser and synchronized when you reconnect to the server.
            </p>
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Projects Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Projects
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stats.projects_count
                  )}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/projects"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all projects →
              </Link>
            </div>
          </motion.div>

          {/* News Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  News Articles
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stats.news_count
                  )}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/news"
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                View all news →
              </Link>
            </div>
          </motion.div>

          {/* Resources Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Resources
                </h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stats.resources_count
                  )}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/resources"
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                View all resources →
              </Link>
            </div>
          </motion.div>

          {/* Contacts Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Contact Messages
                </h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    <span>
                      {stats.contacts_count}{" "}
                      <span className="text-sm font-normal text-orange-500">
                        ({stats.unread_contacts} unread)
                      </span>
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/contacts"
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                View all messages →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            <Link
              to="/admin/projects/new"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center transition duration-300"
            >
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="font-medium text-blue-700">Add New Project</span>
            </Link>

            <Link
              to="/admin/news/new"
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center transition duration-300"
            >
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="font-medium text-green-700">
                Add News Article
              </span>
            </Link>

            <Link
              to="/admin/resources/new"
              className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center transition duration-300"
            >
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="font-medium text-purple-700">
                Upload Resource
              </span>
            </Link>

            <div
              className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex items-center cursor-pointer transition duration-300"
              onClick={() => window.open("/", "_blank")}
            >
              <div className="bg-gray-200 p-3 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <span className="font-medium text-gray-700">View Website</span>
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <SystemStatusCard />
      </div>
    </div>
  );
};

export default AdminDashboard;
