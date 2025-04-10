import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { Resource } from "../../types/resource";
import { PaginatedApiResponse } from "../../types/api";
import SearchBar from "../common/SearchBar";
import ResourceCard from "./ResourceCard";
import Spinner from "../common/Spinner";
import ErrorMessage from "../common/ErrorMessage";
import Pagination from "../common/Pagination";
import CategoryFilter from "../common/CategoryFilter";
import {
  AiOutlineFilePdf,
  AiOutlineFileWord,
  AiOutlineFileExcel,
  AiOutlineFileZip,
  AiOutlineFile,
} from "react-icons/ai";
import resourceService from "../../services/resourceService";
import authService from "../../services/authService";

interface ResourceListProps {
  initialCategory?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({
  initialCategory = "All",
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [downloadingResourceId, setDownloadingResourceId] = useState<
    number | null
  >(null);
  const {
    data: resourcesData,
    loading,
    error,
    execute: fetchResources,
  } = useApi<PaginatedApiResponse<Resource>>();

  // Reference to track the latest page requested
  const latestPageRef = useRef(1);
  // Store all resources to handle pagination locally
  const [allResourcesCache, setAllResourcesCache] = useState<Resource[]>([]);
  // Set a fixed number of resources per page
  const perPage = 9;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get current page of resources from cache
  function getResourcesForCurrentPage(): Resource[] {
    if (!allResourcesCache || allResourcesCache.length === 0) return [];

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return allResourcesCache.slice(startIndex, endIndex);
  }

  // Calculate total pages based on cache
  const calculateTotalPages = (): number => {
    if (!allResourcesCache || allResourcesCache.length === 0) return 1;
    return Math.ceil(allResourcesCache.length / perPage);
  };

  // Use calculated pagination instead of API pagination
  const totalPages = calculateTotalPages();
  const totalItems = allResourcesCache.length;

  useEffect(() => {
    const loadResources = async () => {
      try {
        // Try refreshing the token first
        await authService.refreshToken();

        const params: any = {
          category: selectedCategory === "All" ? undefined : selectedCategory,
          page: 1, // Always request page 1 since we're loading all resources
          per_page: 100, // Increase to fetch all resources at once
        };

        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }

        await fetchResources("GET", "/resources", undefined, {
          params,
        });
      } catch (err) {
        // Keeping essential error logging
        console.error("Failed to load resources");
      }
    };

    loadResources();
  }, [selectedCategory, debouncedSearchTerm, fetchResources, retryCount]); // Remove currentPage from dependencies

  // Process API data when it changes
  useEffect(() => {
    if (resourcesData) {
      // Extract resources from the API response
      const resources = getDisplayResourcesFromData(resourcesData);
      console.log(`Retrieved ${resources.length} resources from API response`);

      // Store all resources in cache for client-side pagination
      setAllResourcesCache(resources);
    }
  }, [resourcesData]);

  // Helper function to safely get pagination data
  const getPaginationData = () => {
    return {
      currentPage: currentPage,
      lastPage: totalPages,
      total: totalItems,
    };
  };

  // Get the resources to display from API data - used only for initial data processing
  const getDisplayResourcesFromData = (data: any): Resource[] => {
    if (!data) return [];

    // If data is directly an array, return it
    if (Array.isArray(data)) {
      return data as Resource[];
    }

    // If data has a data property that is an array, return that
    if (data && "data" in data && Array.isArray((data as any).data)) {
      return (data as any).data as Resource[];
    }

    // For nested data structure (Laravel pagination typical response)
    if (
      data &&
      "data" in data &&
      typeof (data as any).data === "object" &&
      (data as any).data &&
      "data" in (data as any).data &&
      Array.isArray((data as any).data.data)
    ) {
      return (data as any).data.data as Resource[];
    }

    // Last-ditch effort: try to find any array property in the response
    if (typeof data === "object" && data !== null) {
      const possibleArrays = Object.values(data as object).filter(
        (value) => Array.isArray(value) && value.length > 0
      );

      if (possibleArrays.length > 0) {
        return possibleArrays[0] as Resource[];
      }
    }

    // No usable data found
    return [];
  };

  const categories = ["All", "Reports", "Guides", "Toolkits", "Publications"];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    latestPageRef.current = 1;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // No need to do anything here as search is handled by the debounced effect
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  const handleDownload = async (resource: Resource) => {
    try {
      console.log(
        `Initiating download for resource: ${resource.id} - ${resource.title}`
      );

      // Set the downloading resource ID to show loading animation
      setDownloadingResourceId(resource.id);

      // Initiate the download process - this will handle everything internally now
      await resourceService.downloadResource(resource.id);

      // No need to handle blobs anymore since we're using direct download methods

      // Update the download count after a delay to ensure server processing is complete
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        // Clear the downloading state
        setDownloadingResourceId(null);
      }, 1500);

      console.log("Download process completed successfully");
    } catch (error) {
      console.error("Failed to download resource:", error);
      alert("Download failed. Please try again later.");
      // Clear the downloading state on error
      setDownloadingResourceId(null);
    }
  };

  // Helper function to extract file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const typeMap: { [key: string]: string } = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/zip": "zip",
      "application/x-zip-compressed": "zip",
      "text/plain": "txt",
    };

    const cleanMimeType = mimeType?.toLowerCase() || "";
    return typeMap[cleanMimeType] || "bin";
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <ErrorMessage
          message="Failed to load resources. Please try again."
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Use the resources from our client-side pagination
  const displayResources = getResourcesForCurrentPage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Resources</h2>
        <p className="text-gray-600 mb-8">
          Access our collection of resources, reports, and tools for community
          development and humanitarian assistance.
        </p>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          <div className="w-full md:w-64">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchInputChange}
              onSubmit={handleSearch}
              placeholder="Search resources..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            description={resource.description}
            category={resource.category}
            fileType={resource.file_type}
            fileSize={resource.file_size}
            icon={getFileTypeIcon(resource.file_type || "")}
            downloadCount={resource.download_count || 0}
            onDownload={() => handleDownload(resource)}
            isDownloading={downloadingResourceId === resource.id}
          />
        ))}
      </div>

      {displayResources.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <p className="text-lg text-gray-600">
            No resources found matching your criteria.
          </p>
        </div>
      )}

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
    </div>
  );
};

export default ResourceList;
