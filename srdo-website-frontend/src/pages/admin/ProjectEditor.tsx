import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../../hooks/useApi";
import { Project } from "../../types/project";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import authService from "../../services/authService";
import projectService, {
  Project as ServiceProject,
} from "../../services/projectService";

interface ProjectFormData {
  title: string;
  description: string;
  content?: string;
  location: string;
  start_date: string;
  end_date: string | null;
  status: "ongoing" | "completed";
  image_url: string;
  budget: number | null;
  partners: string | any[];
  beneficiaries: string;
}

// Function to ensure proper URL format for images
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return "";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's a data URL (from file input preview), return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // Get backend base URL without any /api segments
  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
  const baseUrl = apiUrl.replace(/\/api.*$/, "").replace(/\/+$/, "");

  // Clean up the image path to ensure it starts with /
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  // Construct the full URL
  const fullUrl = `${baseUrl}${cleanPath}`;

  return fullUrl;
};

const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { get, post, put } = useApi<any>();
  const { logout, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    content: "",
    location: "",
    start_date: "",
    end_date: null,
    status: "ongoing",
    image_url: "",
    budget: null,
    partners: "",
    beneficiaries: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statuses] = useState<string[]>(["ongoing", "completed"]);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setError("Your session has expired. Please log in again.");
      setTimeout(() => {
        logout();
        navigate("/admin/login", { state: { from: window.location.pathname } });
      }, 2000);
    }
  }, [isAuthenticated, navigate, logout]);

  useEffect(() => {
    // If we're editing, fetch the project data
    if (isEditing) {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const fetchProject = async () => {
    try {
      setLoading(true);

      // Try using the project service first
      try {
        const project = await projectService.getProject(id!);

        // Format dates for form input
        if (project.start_date) {
          project.start_date = project.start_date.split("T")[0];
        }
        if (project.end_date) {
          project.end_date = project.end_date.split("T")[0];
        }

        // Fix type conversion by ensuring all required fields are present
        setFormData({
          title: project.title || "",
          description: project.description || "",
          content: project.content || "",
          location: project.location || "",
          start_date: project.start_date || "",
          end_date: project.end_date,
          status: project.status || "ongoing",
          image_url: project.image_url || "",
          budget:
            typeof project.budget === "string"
              ? parseFloat(project.budget) || null
              : project.budget,
          partners: project.partners || [],
          beneficiaries: "", // Add missing field required by ProjectFormData
        });

        if (project.image_url) {
          setImagePreview(getImageUrl(project.image_url));
        }

        return; // Success! We can exit the function
      } catch (serviceError) {
        console.warn(
          "Failed to fetch with projectService, falling back to direct API call:",
          serviceError
        );
        // Continue to the direct API call
      }

      // Fallback to direct API call
      const token = localStorage.getItem("srdo_token");
      if (!token) {
        console.error("No authentication token found");
        setError("Authentication token is missing. Please login again.");
        setTimeout(() => {
          navigate("/admin/login", {
            state: { from: window.location.pathname },
          });
        }, 2000);
        return;
      }

      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

      const response = await axios.get(`${API_URL}/v1/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
      });

      if (response.data) {
        const project = response.data;
        if (project.start_date) {
          project.start_date = project.start_date.split("T")[0];
        }
        if (project.end_date) {
          project.end_date = project.end_date.split("T")[0];
        }

        setFormData({
          ...project,
          beneficiaries: project.beneficiaries || "", // Ensure beneficiaries field is set
          budget:
            typeof project.budget === "string"
              ? parseFloat(project.budget) || null
              : project.budget,
          partners: project.partners || "",
        });

        if (project.image_url) {
          setImagePreview(getImageUrl(project.image_url));
        }
      } else {
        console.error("No data received from API");
        setError("Failed to load project data: No data received");
      }
    } catch (error: any) {
      console.error("Error fetching project:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load project";
      setError(`Error loading project: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // For editing existing projects, use a robust update approach
      if (isEditing) {
        await updateExistingProject();
      }
      // For new projects, use FormData for file uploads
      else {
        await createNewProject();
      }

      setSuccess("Project saved successfully!");
      setTimeout(() => {
        navigate("/admin/projects");
      }, 2000);
    } catch (error: any) {
      console.error("Error saving project:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save project";
      setError(`Error saving project: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Create a new project using FormData (for file uploads)
  const createNewProject = async () => {
    const formDataToSend = new FormData();

    // Add each field explicitly to FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formDataToSend.append(key, value.toString());
      }
    });

    // Add image if available
    if (imageFile) {
      formDataToSend.append("image", imageFile);
    }

    const config = {
      onUploadProgress: (progressEvent: any) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      },
    };

    try {
      // Try to create using the project service first with extracted data (not FormData)

      // Use regular API call with FormData instead of projectService
      await post("/projects", formDataToSend, {
        ...config,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (apiError) {
      console.error("Failed to create project with API:", apiError);
      throw apiError;
    }
  };

  // Update an existing project using multiple fallback strategies
  const updateExistingProject = async () => {
    // Prepare JSON data
    const jsonData = {
      title: formData.title,
      description: formData.description,
      content: formData.content,
      location: formData.location,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      budget: formData.budget,
      partners: formData.partners,
      beneficiaries: formData.beneficiaries,
      keep_existing_image: !imageFile && !!imagePreview ? 1 : 0,
    };

    // Try direct axios approach first as it's often most reliable for Laravel backends
    try {
      const apiUrl =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
      const endpoint = `${apiUrl}/projects/${id}`;

      // Get authentication token
      const token = localStorage.getItem("srdo_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // First fetch CSRF token
      try {
        const baseUrl = apiUrl.replace(/\/api\/v1$/, "").replace(/\/api$/, "");
        await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });
      } catch (csrfError) {
        console.error("Failed to fetch CSRF token:", csrfError);
        // Continue anyway
      }

      let response;

      // If we have an image, use FormData with POST /_method=PUT
      if (imageFile) {
        const formDataToSend = new FormData();

        // Add each field explicitly to FormData
        Object.entries(jsonData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formDataToSend.append(key, String(value));
          }
        });

        // Add image
        formDataToSend.append("image", imageFile);

        // Add _method=PUT to support Laravel's method spoofing
        formDataToSend.append("_method", "PUT");

        // Make POST request with FormData and _method=PUT
        response = await axios.post(endpoint, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          onUploadProgress: (progressEvent: any) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        });
      } else {
        // If no image, we can use JSON with PUT
        response = await axios.put(endpoint, jsonData, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
      }

      return response.data;
    } catch (axiosError: any) {
      console.warn("Failed with direct axios approach:", axiosError);
      // Provide more detailed error info
      if (axiosError.response) {
        console.error("Response data:", axiosError.response.data);
        console.error("Response status:", axiosError.response.status);
      }

      // If we get here, try the useApi hook as a backup
    }

    // Try useApi hook as a fallback
    try {
      const formDataToSend = new FormData();

      // Add each field explicitly to FormData
      Object.entries(jsonData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add _method=PUT to support Laravel's method spoofing
      formDataToSend.append("_method", "PUT");

      // Add image if available
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      };

      // Use post with _method=PUT for more reliable Laravel handling
      const response = await post(`/projects/${id}`, formDataToSend, config);

      return response;
    } catch (useApiError: any) {
      console.error("All update methods failed");
      if (useApiError.response) {
        console.error("Response data:", useApiError.response.data);
        console.error("Response status:", useApiError.response.status);
      }
      throw useApiError;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={isEditing ? "Edit Project" : "Create New Project"}
          description={
            isEditing ? "Update project details" : "Add a new project"
          }
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-900"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-900"
              >
                Description (Brief summary)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-900"
              >
                Detailed Content
              </label>
              <textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide detailed information about the project. HTML formatting is supported."
              />
              <p className="text-xs text-gray-500 mt-1">
                This field supports HTML for rich formatting. If left empty, the
                description will be used.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-900"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "ongoing" | "completed",
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-900"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-medium text-gray-900"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-medium text-gray-900"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      end_date: e.target.value || null,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-900"
              >
                Budget
              </label>
              <input
                type="number"
                id="budget"
                value={formData.budget || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Project Image
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview}
                      alt="Project preview"
                      className="object-cover w-full h-full rounded-lg border border-gray-200"
                      onError={(e) => {
                        console.error(
                          "Error loading image preview:",
                          imagePreview
                        );
                        // Hide the broken image by setting display to none
                        (e.target as HTMLImageElement).style.display = "none";
                        // Try to log what might be wrong with the URL
                        if (imagePreview && imagePreview.startsWith("/")) {
                          console.warn(
                            "Image path is relative and might not resolve correctly:",
                            imagePreview
                          );
                        }
                      }}
                    />
                    {/* Add image URL debugging information during development */}
                    {process.env.NODE_ENV === "development" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 overflow-hidden">
                        {imagePreview.startsWith("data:image")
                          ? "Base64 image"
                          : imagePreview.substring(0, 15) + "..."}
                      </div>
                    )}
                  </div>
                )}
                <label className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                  <span>{imagePreview ? "Change image" : "Upload image"}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {/* Only show a simple indicator if it's a base64 image, not the full string */}
              {imagePreview && process.env.NODE_ENV === "development" && (
                <p className="mt-2 text-xs text-gray-500 break-all">
                  Image source:{" "}
                  {imagePreview.startsWith("data:image")
                    ? "Base64 encoded image data (not yet uploaded to server)"
                    : imagePreview}
                </p>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-1 rounded-full bg-gray-100">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  Uploading... {uploadProgress}%
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin/projects")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Update Project"
                  : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
