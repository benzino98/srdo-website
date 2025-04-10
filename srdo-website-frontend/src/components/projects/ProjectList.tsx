import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { Project } from "../../types/project";
import { PaginatedApiResponse } from "../../types/api";
import projectService from "../../services/projectService";

interface ProjectListProps {
  initialStatus?: "ongoing" | "completed" | "all";
}

// Function to truncate description to a specific word limit
const truncateDescription = (
  description: string,
  wordLimit: number = 30
): string => {
  if (!description) return "No description available";

  const words = description.split(/\s+/);
  if (words.length <= wordLimit) return description;

  const truncated = words.slice(0, wordLimit).join(" ");
  return `${truncated}...`;
};

// Function to ensure proper URL format for images
const getImageUrl = (
  imageUrl: string | null | undefined,
  projectTitle?: string
): string => {
  if (!imageUrl) {
    // Use local fallback images based on project title if available
    if (projectTitle) {
      const titleLower = projectTitle.toLowerCase();
      if (
        titleLower.includes("farm") ||
        titleLower.includes("agriculture") ||
        titleLower.includes("sustainable")
      ) {
        return "/images/projects/clean-water.jpg";
      } else if (titleLower.includes("water") || titleLower.includes("clean")) {
        return "/images/projects/farming.jpg";
      } else if (
        titleLower.includes("education") ||
        titleLower.includes("school") ||
        titleLower.includes("learning")
      ) {
        return "/images/projects/education.jpg";
      }
    }
    // Default fallback
    return "/images/projects/farming.jpg";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Get the base URL without /api/v1
  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
  // Remove both /api/v1 and /api to ensure clean base URL
  const baseUrl = apiUrl.split("/api")[0];

  // Clean up the image URL
  const cleanImageUrl = imageUrl.replace(/([^:])\/+/g, "$1/");

  // If it's a local images path
  if (cleanImageUrl.startsWith("/images")) {
    return cleanImageUrl;
  }

  // Handle storage URLs - ensure we're using the correct path structure
  if (
    cleanImageUrl.includes("storage/projects/") ||
    cleanImageUrl.includes("/storage/projects/")
  ) {
    // Remove any leading slash and ensure proper path structure
    const normalizedPath = cleanImageUrl.replace(/^\/+/, "");
    const fullUrl = `${baseUrl}/${normalizedPath}`;
    return fullUrl;
  }

  // If it's just a filename
  if (!cleanImageUrl.includes("/")) {
    const fullUrl = `${baseUrl}/storage/projects/${cleanImageUrl}`;
    return fullUrl;
  }

  // Final fallback
  const normalizedPath = cleanImageUrl.replace(/^\/+/, "");
  const fullUrl = `${baseUrl}/storage/projects/${normalizedPath}`;
  return fullUrl;
};

const ProjectList: React.FC<ProjectListProps> = ({ initialStatus = "all" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [retryCount, setRetryCount] = useState(0);
  const [manualLoading, setManualLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Reference to track the latest page requested
  const latestPageRef = useRef(1);
  // Store all projects to handle pagination locally
  const [allProjectsCache, setAllProjectsCache] = useState<Project[]>([]);
  // Set a fixed number of projects per page
  const perPage = 9;

  const {
    data: projectsData,
    loading: apiLoading,
    error,
    execute: fetchProjects,
  } = useApi<PaginatedApiResponse<Project>>();

  // Use either API loading state or manual loading state
  const loading = apiLoading || manualLoading;

  // Get projects from the API data with a more robust approach
  const getProjects = (): Project[] => {
    if (!projectsData) return [];

    // If projectsData is directly an array, return it
    if (Array.isArray(projectsData)) {
      return projectsData;
    }

    // If projectsData has a data property that is an array, return that
    if (
      projectsData &&
      typeof projectsData === "object" &&
      "data" in projectsData &&
      Array.isArray((projectsData as any).data)
    ) {
      return (projectsData as any).data;
    }

    // For nested data structure (Laravel pagination typical response)
    if (
      projectsData &&
      typeof projectsData === "object" &&
      "data" in projectsData &&
      typeof (projectsData as any).data === "object" &&
      (projectsData as any).data &&
      "data" in (projectsData as any).data &&
      Array.isArray((projectsData as any).data.data)
    ) {
      return (projectsData as any).data.data;
    }

    // Last-ditch effort: try to find any array property in the response
    if (typeof projectsData === "object" && projectsData !== null) {
      const possibleArrays = Object.values(projectsData as object).filter(
        (value) => Array.isArray(value) && value.length > 0
      );

      if (possibleArrays.length > 0) {
        return possibleArrays[0] as Project[];
      }
    }

    // No usable data found
    return [];
  };

  // Use cached projects for display
  const projects = getProjectsForCurrentPage();

  // Get pagination information safely
  const getPaginationData = () => {
    if (!projectsData) return { currentPage: 1, lastPage: 1, total: 0 };

    // Check if pagination data is in meta object or at the root level
    const meta = projectsData.meta || {};
    return {
      currentPage:
        projectsData.meta?.current_page || projectsData.current_page || 1,
      lastPage: projectsData.meta?.last_page || projectsData.last_page || 1,
      total: projectsData.meta?.total || projectsData.total || 0,
    };
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is already handled by the debounced effect
  };

  // Process API data when it changes
  useEffect(() => {
    if (projectsData) {
      // Get projects directly from data instead of using the function to avoid dependencies
      let allProjects: Project[] = [];

      // Extract projects from projectsData using same logic as getProjects function
      if (Array.isArray(projectsData)) {
        allProjects = projectsData;
      } else if (
        projectsData &&
        typeof projectsData === "object" &&
        "data" in projectsData &&
        Array.isArray((projectsData as any).data)
      ) {
        allProjects = (projectsData as any).data;
      } else if (
        projectsData &&
        typeof projectsData === "object" &&
        "data" in projectsData &&
        typeof (projectsData as any).data === "object" &&
        (projectsData as any).data &&
        "data" in (projectsData as any).data &&
        Array.isArray((projectsData as any).data.data)
      ) {
        allProjects = (projectsData as any).data.data;
      } else if (typeof projectsData === "object" && projectsData !== null) {
        const possibleArrays = Object.values(projectsData as object).filter(
          (value) => Array.isArray(value) && value.length > 0
        );

        if (possibleArrays.length > 0) {
          allProjects = possibleArrays[0] as Project[];
        }
      }

      // Sort projects by creation date in descending order (newest first)
      allProjects.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      console.log(`Retrieved ${allProjects.length} projects from API response`);

      // Store all projects in cache
      setAllProjectsCache(allProjects);
    }
  }, [projectsData]);

  // Get current page of projects from cache
  function getProjectsForCurrentPage(): Project[] {
    if (!allProjectsCache || allProjectsCache.length === 0) return [];

    // Filter projects by search term if it exists
    let filteredProjects = allProjectsCache;
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filteredProjects = allProjectsCache.filter(
        (project) =>
          project.title?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.location?.toLowerCase().includes(searchLower)
      );
    }

    // Projects are already sorted by date in the cache, so no need to sort again here

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return filteredProjects.slice(startIndex, endIndex);
  }

  // Calculate total pages based on filtered cache
  const calculateTotalPages = (): number => {
    if (!allProjectsCache || allProjectsCache.length === 0) return 1;

    // Count filtered projects for pagination
    let filteredCount = allProjectsCache.length;
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filteredCount = allProjectsCache.filter(
        (project) =>
          project.title?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.location?.toLowerCase().includes(searchLower)
      ).length;
    }

    return Math.ceil(filteredCount / perPage);
  };

  // Use calculated pagination instead of API pagination
  const totalPages = calculateTotalPages();
  const totalItems = allProjectsCache.length;

  // Effect for loading projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setManualLoading(true);
        setDatabaseError(false);

        // Create simplified params to avoid schema issues
        const params: any = {
          // Request all projects at once with a high per_page
          per_page: 100,
          page: 1,
        };

        // Only add status filter if not "all"
        if (status !== "all") {
          params.status = status;
        }

        // Add search parameter if there's a search term
        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }

        // Fetch projects from API
        await fetchProjects("GET", "/projects", undefined, {
          params,
        });
      } catch (err: any) {
        // Check if it's the specific database schema error
        if (
          err?.message?.includes("Unknown column") ||
          err?.message?.includes("SQLSTATE[42S22]")
        ) {
          setDatabaseError(true);
        }

        // Retry logic for transient errors (maximum 3 retries)
        if (retryCount < 3 && !databaseError) {
          setRetryCount((prev) => prev + 1);
          // Wait a second before retrying
          setTimeout(() => {
            loadProjects();
          }, 1000);
        }
      } finally {
        setManualLoading(false);
      }
    };

    loadProjects();
  }, [status, debouncedSearchTerm, fetchProjects, retryCount, databaseError]);

  const handleStatusChange = (newStatus: typeof status) => {
    setStatus(newStatus);
    setCurrentPage(1);
    latestPageRef.current = 1;
  };

  const handlePageChange = (page: number) => {
    console.log("Changing page to:", page);
    // Update the page ref immediately
    latestPageRef.current = page;
    // Update the UI state
    setCurrentPage(page);
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Handle project deletion
  const handleDeleteClick = (projectId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setDeleteLoading(true);
      await projectService.deleteProject(projectToDelete);

      // Update the local cache instead of refetching
      const updatedProjects = allProjectsCache.filter(
        (p) => p.id !== projectToDelete
      );
      // No need to re-sort as we're just removing an item, order is preserved
      setAllProjectsCache(updatedProjects);

      // Update current page if it becomes empty
      const currentPageProjects = getProjectsForCurrentPage();
      if (currentPageProjects.length === 0 && currentPage > 1) {
        setCurrentPage(Math.max(1, currentPage - 1));
        latestPageRef.current = Math.max(1, currentPage - 1);
      }

      // Close the modal
      setProjectToDelete(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
    setShowDeleteModal(false);
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2 text-gray-600">Loading projects...</p>
      </div>
    );
  }

  // Handle database error state
  if (databaseError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Database Configuration Issue
        </h2>
        <p className="text-gray-700 mb-4">
          There appears to be a mismatch between the API and database schema.
          Please contact your administrator to fix the database column issues.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Go Home
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle error state
  if (error && !databaseError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Error Loading Projects
        </h2>
        <p className="text-gray-700">{error.message}</p>
        <button
          onClick={() => {
            setRetryCount(0);
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Add empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Projects Found
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? `No projects matching "${searchTerm}" were found. Try a different search term or clear your search.`
              : "There are currently no projects available. Please check back later for updates on our initiatives."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter and Search section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          {/* Filter Buttons */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => handleStatusChange("all")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                status === "all"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              All Projects
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("ongoing")}
              className={`px-4 py-2 text-sm font-medium ${
                status === "ongoing"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300"
              }`}
            >
              Ongoing
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                status === "completed"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex gap-4 w-full md:w-auto md:max-w-md"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchInputChange}
              placeholder="Search projects..."
              className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project: any, index: number) => (
          <motion.div
            key={project.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <img
              src={getImageUrl(project.image_url, project.title)}
              alt={project.title || "Project"}
              className="w-full h-48 object-cover"
              onError={(e) => {
                // Replace with fallback image on error
                (e.target as HTMLImageElement).src = getImageUrl(
                  undefined,
                  project.title
                );
              }}
            />
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">
                  {project.title || "Untitled Project"}
                </h3>
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    project.status === "ongoing"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {project.status
                    ? project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)
                    : "Unknown Status"}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {truncateDescription(project.description)}
              </p>
              <div className="flex justify-between items-center">
                <Link
                  to={`/project/${project.id}`}
                  aria-label={`View details for ${project.title}`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  Learn More
                </Link>
                <span className="text-sm text-gray-500">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "Unknown date"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <button
            onClick={() => {
              console.log(
                "Previous button clicked. Current page:",
                currentPage
              );
              const prevPage = Math.max(1, currentPage - 1);
              console.log("Going to previous page:", prevPage);
              handlePageChange(prevPage);
            }}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded-lg shadow-sm ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            } transition font-medium`}
          >
            Previous
          </button>
          <span className="px-5 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => {
              console.log(
                "Next button clicked. Current page:",
                currentPage,
                "Total pages:",
                totalPages
              );
              const nextPage = Math.min(totalPages, currentPage + 1);
              console.log("Going to next page:", nextPage);
              handlePageChange(nextPage);
            }}
            disabled={currentPage >= totalPages}
            className={`px-5 py-2 rounded-lg shadow-sm ${
              currentPage >= totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            } transition font-medium`}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
