import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../../hooks/useApi";
import { Resource } from "../../types/resource";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import authService from "../../services/authService";

interface ResourceFormData extends Partial<Resource> {
  is_published?: boolean;
}

const ResourceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { get, post, put } = useApi<any>();
  const { isAuthenticated, login, logout } = useAuth();

  const [formData, setFormData] = useState<ResourceFormData>({
    title: "",
    category: "document",
    description: "",
    is_published: false,
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reloginAttempted, setReloginAttempted] = useState(false);
  const [categories] = useState<string[]>([
    "document",
    "report",
    "form",
    "guide",
    "presentation",
    "data",
    "research",
  ]);

  // Function to attempt refreshing the authentication session
  const refreshSession = async () => {
    try {
      const refreshed = await authService.refreshToken();
      return refreshed;
    } catch (error) {
      return false;
    }
  };

  // Check if user is authenticated and attempt to refresh session if not
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !reloginAttempted) {
        setReloginAttempted(true);

        // Try refresh directly without verification
        const refreshed = await refreshSession();

        if (!refreshed) {
          setError("Your session has expired. Please login again.");
          navigate("/admin/login", {
            state: { from: `/admin/resources${isEditing ? `/${id}` : "/new"}` },
          });
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, id, isEditing, reloginAttempted]);

  useEffect(() => {
    // If we're editing, fetch the resource data
    if (isEditing && isAuthenticated) {
      fetchResource();
    } else {
      setLoading(false);
    }
  }, [id, isEditing, isAuthenticated]);

  const fetchResource = async () => {
    try {
      setLoading(true);

      // Get the auth token
      const token = localStorage.getItem("srdo_token");
      if (!token) {
        setError("Authentication token is missing. Please login again.");
        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      // Using axios directly with explicit headers for better debug control
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api";

      // Fix the URL construction to avoid duplicating 'v1'
      // Check if API_URL already includes '/v1' to avoid duplication
      const apiEndpoint = API_URL.endsWith("/v1")
        ? `${API_URL}/resources/${id}`
        : `${API_URL}/v1/resources/${id}`;

      const response = await axios.get(apiEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
      });

      if (response.data) {
        // Ensure is_published is always a boolean value
        const resourceData = response.data;

        // Convert is_published to a proper boolean if it exists
        if ("is_published" in resourceData) {
          resourceData.is_published =
            resourceData.is_published === true ||
            resourceData.is_published === 1 ||
            resourceData.is_published === "1" ||
            resourceData.is_published === "true";
        } else {
          // Default to false if not present
          resourceData.is_published = false;
        }

        setFormData(resourceData);
      } else {
        setError("Failed to load resource data: No data received");
      }
      setError(null);
    } catch (err: any) {
      // Check if this is an authentication error
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      // More detailed error handling
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError(`Failed to load resource data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // For is_published field, ensure it's handled as a boolean
    if (name === "is_published") {
      const boolValue = value === "true" || value === "1";
      setFormData((prev) => ({
        ...prev,
        [name]: boolValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      // Always refresh token at the beginning of form submission
      const refreshSuccess = await refreshSession();

      if (!refreshSuccess) {
        setError("Your session has expired. Please login again.");

        // Store the current path so we can redirect back after login
        sessionStorage.setItem(
          "redirect_after_login",
          window.location.pathname
        );

        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      // Check if we're in offline mode
      const isOffline = !navigator.onLine;

      if (isOffline) {
        // Handle offline resource creation/update
        const currentResources = JSON.parse(
          localStorage.getItem("offline_resources") || "[]"
        );

        if (isEditing) {
          // Update existing resource in localStorage
          const updatedResources = currentResources.map((resource: any) =>
            resource.id === Number(id)
              ? {
                  ...resource,
                  ...formData,
                  updated_at: new Date().toISOString(),
                }
              : resource
          );
          localStorage.setItem(
            "offline_resources",
            JSON.stringify(updatedResources)
          );
        } else {
          // Create with a temporary ID
          const tempResource = {
            ...formData,
            id: Date.now(), // Use timestamp as temporary ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem(
            "offline_resources",
            JSON.stringify([...currentResources, tempResource])
          );
        }

        setSuccess(
          "Resource saved offline. Changes will be synced when you're back online."
        );
        setTimeout(() => {
          navigate("/admin/resources");
        }, 2000);
        return;
      }

      // Get the auth token
      const token = localStorage.getItem("srdo_token");
      if (!token) {
        setError("Authentication token is missing. Please login again.");
        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      // Prepare form data
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle boolean values properly for Laravel
          if (typeof value === "boolean") {
            // For Laravel, convert booleans to 1/0 integers
            formDataObj.append(key, value ? "1" : "0");
          } else {
            formDataObj.append(key, value.toString());
          }
        }
      });

      // Add file if selected
      if (file) {
        formDataObj.append("file", file);
      }

      // Use cancelToken to allow aborting the request
      const source = axios.CancelToken.source();

      // Get the API URL
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api";

      // Build the correct endpoint URL
      const apiEndpoint = API_URL.endsWith("/v1")
        ? `${API_URL}/resources${isEditing ? `/${id}` : ""}`
        : `${API_URL}/v1/resources${isEditing ? `/${id}` : ""}`;

      // For PUT requests with FormData, we need to use the _method field
      if (isEditing) {
        formDataObj.append("_method", "PUT");
      }

      // Make the API request
      const response = await axios({
        method: isEditing ? "POST" : "POST", // Always use POST with FormData, Laravel will handle it
        url: apiEndpoint,
        data: formDataObj,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
        cancelToken: source.token,
      });

      setSuccess(
        isEditing
          ? "Resource updated successfully!"
          : "Resource created successfully!"
      );

      // Redirect back to the resource list after a short delay
      setTimeout(() => {
        navigate("/admin/resources");
      }, 2000);
    } catch (err: any) {
      // Handle errors
      if (axios.isCancel(err)) {
        setError("Upload cancelled");
        return;
      }

      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      // Parse the error message
      let errorMessage = "Failed to save resource";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Laravel validation errors
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError)
          ? firstError[0]
          : String(firstError);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <AdminPageHeader
          title={isEditing ? "Edit Resource" : "Upload New Resource"}
          description={
            isEditing
              ? "Update the details of an existing resource"
              : "Add a new resource to the SRDO collection"
          }
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resource Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide a detailed description of the resource"
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_published"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Publish immediately
                </label>
              </div>

              <div>
                <label
                  htmlFor="resource_file"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {isEditing ? "Replace File" : "Upload File"}*
                </label>
                <input
                  type="file"
                  id="resource_file"
                  name="resource_file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 
                      file:mr-4 file:py-2 file:px-4 
                      file:rounded-md file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-green-50 file:text-green-700 
                      hover:file:bg-green-100"
                  required={!isEditing}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload documents (PDF, DOCX, XLSX, etc.), images, or other
                  resources.
                </p>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-right mt-1">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}

                {file && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Selected file: {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                )}

                {isEditing && formData.file_path && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700">
                      Current File
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.file_path.split("/").pop() || "Unknown file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (Upload a new file to replace this one)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/admin/resources")}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Update Resource"
                  : "Upload Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function to display file size in a readable format
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default ResourceForm;
