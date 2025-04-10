import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../../services/authService";

/**
 * Project Form Component
 * This component uses Tailwind CSS for styling instead of React Bootstrap.
 * All UI elements (containers, spinners, alerts, forms, etc.) are native HTML elements
 * with Tailwind classes for styling.
 */

// Local config constants to replace missing config import
const API_CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1",
  STORAGE_KEYS: {
    OFFLINE_PROJECTS: "srdo_offline_projects",
  },
};

interface ProjectFormProps {
  projectId?: string;
  editMode?: boolean;
}

interface Project {
  id?: number;
  title: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: string;
  image?: File | null;
  image_url?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  projectId,
  editMode = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [project, setProject] = useState<Project>({
    title: "",
    description: "",
    location: "",
    status: "active",
    start_date: "",
    end_date: "",
    budget: "",
    image: null,
    image_url: "",
  });

  // Check if the server is online
  const checkServerStatus = async () => {
    try {
      await axios.get(`${API_CONFIG.API_URL}/ping`, { timeout: 3000 });
      console.log("Server is online");
      setIsServerOnline(true);
      return true;
    } catch (error) {
      console.log("Server appears to be offline:", error);
      setIsServerOnline(false);
      return false;
    }
  };

  // Verify and potentially refresh authentication
  const verifyAuth = async (): Promise<boolean> => {
    console.log("Verifying authentication...");

    // Get current token
    const token = authService.getToken();

    if (!token) {
      console.error("No authentication token found");
      return false;
    }

    // Check if it's the mock token
    if (token.includes("mock-signature-for-testing-only")) {
      console.log(
        "Mock token detected, attempting to re-authenticate with test credentials"
      );

      // Check if server is online
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        console.log("Server offline, proceeding with mock token");
        return true; // Allow mock auth when offline
      }

      // Try to login with test credentials
      try {
        // Fix: Pass credentials object matching LoginCredentials interface
        const user = await authService.login({
          email: "admin@srdo.org",
          password: "admin123",
        });
        return !!user; // Return true if login succeeded
      } catch (error) {
        console.error("Login failed:", error);
        return false;
      }
    }

    // Verify the token with the server
    try {
      const isValid = await authService.verifyToken();
      console.log("Token verification result:", isValid);
      return isValid;
    } catch (error) {
      console.error("Error verifying token:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!editMode || !projectId) return;

      setLoading(true);
      setError(null);

      try {
        // Check server status
        const isOnline = await checkServerStatus();

        if (isOnline) {
          // Get project from API if online
          const token = authService.getToken();

          // Fix: Don't directly call the private setAuthHeader method
          // Instead, just set the axios header for this specific request
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const response = await axios.get(
            `${API_CONFIG.API_URL}/v1/projects/${projectId}`,
            { headers }
          );
          console.log("Fetched project data:", response.data);

          const projectData = response.data.data || response.data;

          setProject({
            ...projectData,
            start_date: projectData.start_date
              ? projectData.start_date.split(" ")[0]
              : "",
            end_date: projectData.end_date
              ? projectData.end_date.split(" ")[0]
              : "",
            image: null,
          });

          if (projectData.image_url) {
            setImagePreview(projectData.image_url);
          }
        } else {
          // Get project from localStorage if offline
          const offlineProjects = JSON.parse(
            localStorage.getItem(API_CONFIG.STORAGE_KEYS.OFFLINE_PROJECTS) ||
              "[]"
          );
          const offlineProject = offlineProjects.find(
            (p: any) => p.id === parseInt(projectId)
          );

          if (offlineProject) {
            setProject({
              ...offlineProject,
              image: null,
            });

            if (offlineProject.image_url) {
              setImagePreview(offlineProject.image_url);
            }
          } else {
            setError("Project not found in offline storage");
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, editMode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProject((prev) => ({ ...prev, image: file }));

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveOfflineProject = (projectData: Project) => {
    try {
      // Get existing projects from localStorage
      const existingProjects = JSON.parse(
        localStorage.getItem(API_CONFIG.STORAGE_KEYS.OFFLINE_PROJECTS) || "[]"
      );

      // Create a new project object with a temporary ID if it's a new project
      const newProject = {
        ...projectData,
        id: editMode && project.id ? project.id : Date.now(),
        image_url: imagePreview,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let updatedProjects;

      if (editMode && project.id) {
        // Update existing project
        updatedProjects = existingProjects.map((p: any) =>
          p.id === project.id ? newProject : p
        );
      } else {
        // Add new project
        updatedProjects = [...existingProjects, newProject];
      }

      // Save to localStorage
      localStorage.setItem(
        API_CONFIG.STORAGE_KEYS.OFFLINE_PROJECTS,
        JSON.stringify(updatedProjects)
      );

      console.log("Project saved locally:", newProject);

      return newProject.id;
    } catch (error) {
      console.error("Error saving project locally:", error);
      throw new Error("Failed to save project offline");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!project.title || !project.description) {
        setError("Title and description are required");
        setLoading(false);
        return;
      }

      // Check server status
      const isOnline = await checkServerStatus();

      if (isOnline) {
        // Verify authentication
        const isAuthenticated = await verifyAuth();
        if (!isAuthenticated) {
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          // Redirect to login page
          navigate("/login");
          return;
        }

        // Create FormData
        const formData = new FormData();

        // Append project fields to FormData
        // Avoid using FormDataIterator to prevent TypeScript errors
        formData.append("title", project.title);
        formData.append("description", project.description);
        formData.append("location", project.location);
        formData.append("status", project.status);
        formData.append("start_date", project.start_date);
        formData.append("end_date", project.end_date);
        formData.append("budget", project.budget);

        // Append image if exists
        if (project.image) {
          formData.append("image", project.image);
        }

        let response;
        // Get token for authorization
        const token = authService.getToken();
        // Set headers with token
        const headers = {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
        };

        try {
          if (editMode && projectId) {
            // Update existing project
            response = await axios.post(
              `${API_CONFIG.API_URL}/v1/projects/${projectId}`,
              formData,
              {
                headers,
              }
            );
            setSuccess("Project updated successfully");
          } else {
            // Create new project
            response = await axios.post(
              `${API_CONFIG.API_URL}/v1/projects`,
              formData,
              {
                headers,
              }
            );
            setSuccess("Project created successfully");
          }

          navigate("/admin/projects");
        } catch (error: any) {
          console.error("Error saving project:", error);
          setError(
            error.response?.data?.message || "Failed to save project data"
          );
        }
      } else {
        // Handle offline submission
        try {
          const projectId = saveOfflineProject(project);
          setSuccess(
            "Project saved locally. It will be synced when you're back online."
          );
          setTimeout(() => {
            navigate("/admin/projects");
          }, 2000);
        } catch (error: any) {
          setError(error.message || "Failed to save project locally");
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !project.title) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            {editMode ? "Edit Project" : "Create New Project"}
          </h1>

          {loading && (
            <div className="flex justify-center items-center mt-4 mb-4">
              {/* Custom Tailwind spinner - not using React Bootstrap Spinner */}
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
              <span className="ml-3">Processing...</span>
            </div>
          )}

          {!isServerOnline && (
            <div className="bg-yellow-100 p-4 rounded-md mb-6 border border-yellow-300">
              <p className="text-yellow-800">
                <strong>Offline Mode:</strong> You are working offline. Your
                changes will be saved locally and synced when you reconnect.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 p-4 rounded-md mb-6 border border-red-300">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-100 p-4 rounded-md mb-6 border border-green-300">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-lg p-6"
          >
            {loading ? (
              <div className="flex justify-center items-center h-64">
                {/* Custom Tailwind spinner - not using React Bootstrap Spinner */}
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Processing...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Project Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={project.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={project.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label
                      htmlFor="location"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={project.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="status"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={project.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="planned">Planned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label
                      htmlFor="start_date"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={project.start_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="end_date"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={project.end_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="budget"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Budget
                  </label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={project.budget}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. $10,000"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="image"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Project Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept="image/*"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">
                        Image Preview:
                      </p>
                      <img
                        src={imagePreview}
                        alt="Project Preview"
                        className="max-w-xs h-auto rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editMode ? "Update Project" : "Create Project"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/projects")}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {editMode ? "Edit Project" : "Create New Project"}
        </h1>

        {loading && (
          <div className="flex justify-center items-center mt-4 mb-4">
            {/* Custom Tailwind spinner - not using React Bootstrap Spinner */}
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
            <span className="ml-3">Processing...</span>
          </div>
        )}

        {!isServerOnline && (
          <div className="bg-yellow-100 p-4 rounded-md mb-6 border border-yellow-300">
            <p className="text-yellow-800">
              <strong>Offline Mode:</strong> You are working offline. Your
              changes will be saved locally and synced when you reconnect.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 p-4 rounded-md mb-6 border border-red-300">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 p-4 rounded-md mb-6 border border-green-300">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              {/* Custom Tailwind spinner - not using React Bootstrap Spinner */}
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              <p className="ml-4 text-gray-600">Processing...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Project Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={project.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={project.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    htmlFor="location"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={project.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="status"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={project.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="planned">Planned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    htmlFor="start_date"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={project.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="end_date"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={project.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="budget"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Budget
                </label>
                <input
                  type="text"
                  id="budget"
                  name="budget"
                  value={project.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. $10,000"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="image"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Project Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept="image/*"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Image Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Project Preview"
                      className="max-w-xs h-auto rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editMode ? "Update Project" : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/projects")}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
