import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useApi } from "../../hooks/useApi";
import { Resource } from "../../types/resource";
import axios from "axios";
import {
  AiOutlineFilePdf,
  AiOutlineFileWord,
  AiOutlineFileExcel,
  AiOutlineFileZip,
  AiOutlineFile,
} from "react-icons/ai";
import authService from "../../services/authService";
import SearchBar from "../../components/common/SearchBar";

const ResourcesList: React.FC = () => {
  const { get, del } = useApi<any>();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  // Reference to track the latest page requested
  const latestPageRef = useRef(1);
  // Store all resources to handle pagination locally
  const [allResourcesCache, setAllResourcesCache] = useState<Resource[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Pagination state - always use exactly 5 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 5; // Changed from state to constant

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadOfflineResources = () => {
    try {
      const offlineResources = JSON.parse(
        localStorage.getItem("offline_resources") || "[]"
      );
      setResources(offlineResources);
      setLoading(false);
    } catch (error) {
      console.error("Error loading offline resources:", error);
      setError("Failed to load resources from local storage");
      setLoading(false);
    }
  };

  const checkServerStatus = async () => {
    const API_URL =
      process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await axios.get(`${API_URL}/ping`, {
        timeout: 5000,
      });
      setIsOfflineMode(false);
    } catch (error) {
      setIsOfflineMode(true);
      loadOfflineResources();
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  useEffect(() => {
    if (!isOfflineMode) {
      fetchResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOfflineMode, currentPage, debouncedSearchTerm]);

  const fetchResources = async (pageToFetch?: number) => {
    try {
      // Use the provided page number, or the ref value, or fallback to current page state
      const pageNumber =
        pageToFetch !== undefined ? pageToFetch : latestPageRef.current;

      console.log(
        "Fetching resources for page:",
        pageNumber,
        "Latest page ref:",
        latestPageRef.current
      );
      setLoading(true);
      setError(null);

      try {
        await authService.refreshToken();
      } catch (refreshError) {}

      // Make sure we're sending the correct pagination parameters
      const queryParams: any = {
        per_page: perPage,
        page: pageNumber,
      };

      // Add search term to params if it exists
      if (debouncedSearchTerm) {
        queryParams.search = debouncedSearchTerm;
      }

      console.log("Sending request with params:", queryParams);

      // For page 1, always fetch from API
      // For pages > 1, check if we have all resources cached first
      if (
        pageNumber === 1 ||
        allResourcesCache.length === 0 ||
        debouncedSearchTerm
      ) {
        // Fetch first page or if we don't have cache or if we're searching
        const response = await get("/resources", {
          params: {
            ...queryParams,
            per_page: 100, // Get more resources at once to reduce API calls
          },
        });

        console.log("API Response:", response);

        if (response) {
          let fetchedResources: Resource[] = [];

          // Debug the full response structure
          console.log(
            "Full API response structure:",
            JSON.stringify(response, null, 2)
          );

          if (Array.isArray(response)) {
            console.log("Response is an array");
            fetchedResources = response;
          } else if (response.data && Array.isArray(response.data)) {
            console.log("Response has data array");
            fetchedResources = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            console.log("Response has nested data array");
            fetchedResources = response.data.data;
          } else if (typeof response === "object") {
            console.log("Response is an object, looking for arrays");
            // First check if response itself has data property
            if (
              response.data &&
              typeof response.data === "object" &&
              !Array.isArray(response.data)
            ) {
              console.log("Checking response.data object for resources");
              for (const key in response.data) {
                if (Array.isArray(response.data[key])) {
                  console.log(`Found array in response.data.${key}`);
                  fetchedResources = response.data[key];
                  break;
                }
              }
            }

            // If no resources found yet, check all properties of response
            if (fetchedResources.length === 0) {
              const possibleArrays = Object.entries(response).filter(
                ([key, value]) => Array.isArray(value) && value.length > 0
              );

              if (possibleArrays.length > 0) {
                console.log(`Found array in response.${possibleArrays[0][0]}`);
                fetchedResources = possibleArrays[0][1];
              }
            }
          }

          console.log("Extracted all resources:", fetchedResources);

          // Store all resources in our cache
          setAllResourcesCache(fetchedResources);

          // Calculate total pages based on the full resource count
          const totalCount = fetchedResources.length;
          const calculatedTotalPages = Math.ceil(totalCount / perPage);
          console.log(
            `Total resources: ${totalCount}, Total pages: ${calculatedTotalPages}`
          );

          setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          setTotalItems(totalCount);

          // Apply pagination on client side
          handleClientPagination(fetchedResources, pageNumber);
        } else {
          setResources([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } else {
        // We already have resources cached, just paginate on client side
        console.log("Using cached resources for pagination");
        handleClientPagination(allResourcesCache, pageNumber);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setError("Failed to load resources");
      setIsOfflineMode(true);
      loadOfflineResources();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle client-side pagination
  const handleClientPagination = (
    allResources: Resource[],
    pageNumber: number
  ) => {
    // Calculate correct slicing based on current page
    const startIndex = (pageNumber - 1) * perPage;
    const totalItems = allResources.length;

    console.log(
      `Paginating resources: ${totalItems} total, page ${pageNumber}, start index ${startIndex}`
    );

    // Make sure we don't go past the end of the array
    if (startIndex < allResources.length) {
      const paginatedResources = allResources.slice(
        startIndex,
        Math.min(startIndex + perPage, allResources.length)
      );
      console.log(
        `Showing resources ${startIndex + 1}-${
          startIndex + paginatedResources.length
        } of ${allResources.length}`
      );
      setResources(paginatedResources);
    } else if (allResources.length > 0) {
      // If somehow the start index is beyond the array length, go to last page
      const lastPageNumber = Math.ceil(allResources.length / perPage);
      console.log(
        `Start index out of bounds, going to last page: ${lastPageNumber}`
      );

      const lastPageStartIndex = (lastPageNumber - 1) * perPage;
      setCurrentPage(lastPageNumber);
      latestPageRef.current = lastPageNumber;

      const lastPageResources = allResources.slice(
        lastPageStartIndex,
        allResources.length
      );
      setResources(lastPageResources);
    } else {
      // No resources at all
      console.log("No resources available");
      setResources([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (isOfflineMode) {
      try {
        const offlineResources = JSON.parse(
          localStorage.getItem("offline_resources") || "[]"
        );
        const updatedResources = offlineResources.filter(
          (resource: Resource) => resource.id !== id
        );
        localStorage.setItem(
          "offline_resources",
          JSON.stringify(updatedResources)
        );
        setResources(updatedResources);
        setDeleteConfirm(null);
      } catch (error) {
        setError("Failed to delete resource from local storage");
      }
    } else {
      try {
        setLoading(true);
        setError(null);

        await del(`/resources/${id}`);

        setResources(resources.filter((resource) => resource.id !== id));
        setDeleteConfirm(null);
      } catch (err: any) {
        console.error("Failed to delete resource");
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete resource";
        setError(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    latestPageRef.current = page;
    setCurrentPage(page);
    // Already handled by the useEffect dependency on currentPage
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search term changes
    latestPageRef.current = 1;
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
    latestPageRef.current = 1;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes("pdf"))
      return <AiOutlineFilePdf className="text-red-500" size={24} />;
    if (type.includes("doc") || type.includes("word"))
      return <AiOutlineFileWord className="text-blue-500" size={24} />;
    if (
      type.includes("xls") ||
      type.includes("excel") ||
      type.includes("sheet")
    )
      return <AiOutlineFileExcel className="text-green-500" size={24} />;
    if (type.includes("zip") || type.includes("archive"))
      return <AiOutlineFileZip className="text-amber-500" size={24} />;
    return <AiOutlineFile className="text-gray-500" size={24} />;
  };

  return (
    <div>
      <AdminPageHeader
        title="Resources"
        description="Manage resource files and documents"
        actionButton={
          <Link
            to="/admin/resources/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add New Resource
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
                Search Resources
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
                placeholder="Search by title, description, or category..."
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
                {resources.length === 0
                  ? "No resources found matching your search."
                  : `Found ${resources.length} resource${
                      resources.length !== 1 ? "s" : ""
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 py-8">
            No resources found. Click "Add New Resource" to upload your first
            resource.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {(() => {
            console.log("Rendering resources:", resources);
            return null;
          })()}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Resource
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Downloads
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
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                        {getFileTypeIcon(resource.file_type || "")}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {resource.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resource.file_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {resource.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(resource.file_size || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {resource.download_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/resources/${resource.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(resource.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    {deleteConfirm === resource.id && (
                      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-xl">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Confirm Delete
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Are you sure you want to delete this resource? This
                            action cannot be undone.
                          </p>
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
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

export default ResourcesList;
