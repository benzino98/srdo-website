import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useApi } from "../../hooks/useApi";
import { Project } from "../../types/project";
import axios from "axios";
import projectService from "../../services/projectService";
import SearchBar from "../../components/common/SearchBar";

// Function to ensure proper URL format for images
const getImageUrl = (
  imageUrl: string | null | undefined,
  projectTitle?: string
): string => {
  if (!imageUrl) {
    return "/images/projects/placeholder.jpg";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Get backend base URL without any /api segments
  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
  const baseUrl = apiUrl.replace(/\/api.*$/, "").replace(/\/+$/, "");

  // Clean up the image path
  const cleanPath = imageUrl
    .replace(/^\/+/, "") // Remove leading slashes
    .replace(/^storage\//, "") // Remove storage/ prefix if present
    .replace(/^projects\//, ""); // Remove projects/ prefix if present

  // Construct the final URL with the storage path
  return `${baseUrl}/storage/projects/${cleanPath}`;
};

const ProjectsList: React.FC = () => {
  const { get, del } = useApi<any>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(5);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Check if we're in offline mode
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    const API_URL =
      process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

    try {
      console.log("Checking server status...");
      const response = await axios.get(`${API_URL}/ping`, {
        timeout: 5000,
      });
      console.log("Server is online:", response.data);
      setIsOfflineMode(false);
    } catch (error) {
      console.error("Server check failed:", error);
      setIsOfflineMode(true);
      loadOfflineProjects();
    }
  };

  const loadOfflineProjects = () => {
    try {
      const offlineProjects = JSON.parse(
        localStorage.getItem("offline_projects") || "[]"
      );
      setProjects(offlineProjects);
      setLoading(false);
    } catch (error) {
      console.error("Error loading offline projects:", error);
      setError("Failed to load projects from local storage");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOfflineMode) {
      fetchProjects();
    }
  }, [isOfflineMode, currentPage, perPage, debouncedSearchTerm]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching projects...");

      const params: any = {
        per_page: perPage,
        page: currentPage,
      };

      // Add search term to params if it exists
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await get("/projects", { params });
      console.log("Projects response:", response);

      if (response && response.data) {
        if (Array.isArray(response.data)) {
          setProjects(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setProjects(response.data.data);
        } else if (typeof response.data === "object") {
          const projectArray = Object.keys(response.data)
            .filter((key) => !isNaN(Number(key)) || key === "data")
            .map((key) =>
              key === "data" && Array.isArray(response.data[key])
                ? response.data[key]
                : response.data[key]
            )
            .flat()
            .filter((item) => item && typeof item === "object");

          setProjects(projectArray.length > 0 ? projectArray : []);
        } else {
          setProjects([]);
        }

        // Set pagination data using type assertion to avoid TypeScript errors
        const responseAny = response as any;
        if (responseAny.meta) {
          setTotalPages(responseAny.meta.last_page || 1);
          setTotalItems(responseAny.meta.total || 0);
        } else if (responseAny.last_page) {
          setTotalPages(responseAny.last_page || 1);
          setTotalItems(responseAny.total || 0);
        }
      } else {
        setProjects([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects");
      setIsOfflineMode(true);
      loadOfflineProjects();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isOfflineMode) {
      try {
        const offlineProjects = JSON.parse(
          localStorage.getItem("offline_projects") || "[]"
        );
        const updatedProjects = offlineProjects.filter(
          (project: Project) => project.id !== id
        );
        localStorage.setItem(
          "offline_projects",
          JSON.stringify(updatedProjects)
        );
        setProjects(updatedProjects);
        setDeleteConfirm(null);
        setDeleteSuccess("Project was deleted from local storage successfully");
        setTimeout(() => setDeleteSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting offline project:", error);
        setError("Failed to delete project from local storage");
      }
    } else {
      try {
        setDeleteInProgress(true);
        setError(null);
        console.log(`Attempting to delete project with ID: ${id}`);

        // Use projectService instead of direct API call
        await projectService.deleteProject(id);
        console.log("Project deleted successfully");

        // Filter out the deleted project from state
        setProjects(projects.filter((project) => project.id !== id));
        setDeleteConfirm(null);
        setDeleteSuccess("Project was deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => setDeleteSuccess(null), 3000);
      } catch (err: any) {
        console.error("Failed to delete project:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete project";
        setError(`Error: ${errorMessage}`);
      } finally {
        setDeleteInProgress(false);
      }
    }
  };

  // Add function to initiate delete confirmation
  const confirmDelete = (id: number) => {
    setDeleteConfirm(id);
  };

  // Add function to cancel delete
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search term changes
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is already handled by the debounced effect
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Projects"
        description="Manage projects"
        actionButton={
          <Link
            to="/admin/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add New Project
          </Link>
        }
      />

      {/* Search and filters section */}
      <div className="mb-6 bg-white shadow-sm rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            {/* Space for additional filters if needed in the future */}
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="news-search"
                className="block text-sm font-medium text-gray-700"
              >
                Search Projects
              </label>
              {searchTerm && (
                <span className="text-xs text-green-600 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Searching...
                </span>
              )}
            </div>
            <div className="relative">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onSubmit={handleSearchSubmit}
                placeholder="Search by title, description, or status..."
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {debouncedSearchTerm && (
              <div className="mt-2 text-sm text-gray-500 text-right">
                {projects.length === 0
                  ? "No projects found matching your search."
                  : `Found ${projects.length} project${
                      projects.length !== 1 ? "s" : ""
                    } matching "${debouncedSearchTerm}"`}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {deleteSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {deleteSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 py-8">
            No projects found. Click "Add New Project" to create your first
            project.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Project
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {project.image_url && (
                        <img
                          className="h-10 w-10 rounded-full object-cover mr-3"
                          src={getImageUrl(project.image_url, project.title)}
                          alt={project.title}
                          onError={(e) => {
                            console.log(
                              "Image failed to load:",
                              project.image_url
                            );
                            e.currentTarget.src =
                              "/images/projects/placeholder.jpg";
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {project.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      {deleteConfirm === project.id ? (
                        <>
                          <span className="text-red-600 mr-2">
                            Confirm delete?
                          </span>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className={`text-red-600 hover:text-red-900 ${
                              deleteInProgress
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={deleteInProgress}
                          >
                            {deleteInProgress ? "Deleting..." : "Yes"}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={deleteInProgress}
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/admin/projects/${project.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => confirmDelete(project.id)}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page{" "}
                    <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span> pages
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
