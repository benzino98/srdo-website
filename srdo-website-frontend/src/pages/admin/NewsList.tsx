import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useApi } from "../../hooks/useApi";
import { NewsArticle } from "../../types/news";
import { ApiResponse, PaginatedApiResponse } from "../../types/api";
import axios from "axios";
import newsService from "../../services/newsService";
import SearchBar from "../../components/common/SearchBar";

// Function to ensure proper URL format for images
const getImageUrl = (
  imageUrl: string | null | undefined,
  articleTitle?: string
): string => {
  if (!imageUrl) {
    return "/images/news/placeholder.jpg";
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
    .replace(/^news\//, ""); // Remove news/ prefix if present

  // Construct the final URL with the storage path
  return `${baseUrl}/storage/news/${cleanPath}`;
};

const NewsList: React.FC = () => {
  const { get, del } = useApi<any>();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
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

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    const API_URL =
      process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await axios.get(`${API_URL}/ping`, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      setIsOfflineMode(false);
    } catch (error) {
      console.error("Server check failed:", error);
      setIsOfflineMode(true);
      loadOfflineArticles();
    }
  };

  const loadOfflineArticles = () => {
    try {
      const offlineArticles = JSON.parse(
        localStorage.getItem("offline_articles") || "[]"
      );
      setArticles(offlineArticles);
      setLoading(false);
    } catch (error) {
      console.error("Error loading offline articles:", error);
      setError("Failed to load articles from local storage");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOfflineMode) {
      fetchArticles();
    }
  }, [isOfflineMode, currentPage, perPage, debouncedSearchTerm]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        per_page: perPage,
        page: currentPage,
      };

      // Add search term to params if it exists
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await get("/news", { params });

      if (response && response.data) {
        const articleData = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const mappedArticles = articleData.map((article: any) => ({
          ...article,
          published: article.is_published,
        }));

        setArticles(mappedArticles);

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
        console.error("Invalid API response format:", response);
        setError(
          "The API returned an unexpected format. Please check the console for details."
        );
      }
    } catch (error: any) {
      console.error("Failed to fetch articles:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load articles";
      setError(`Error loading news articles: ${errorMessage}`);

      const offlineArticles = localStorage.getItem("offline_articles");
      if (offlineArticles) {
        try {
          const parsedArticles = JSON.parse(offlineArticles);
          if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
            setArticles(parsedArticles);
            setError(
              "Could not connect to server. Showing locally stored articles instead."
            );
          }
        } catch (e) {
          console.error("Error parsing localStorage articles:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isOfflineMode) {
      try {
        const offlineNews = JSON.parse(
          localStorage.getItem("offline_news") || "[]"
        );
        const updatedNews = offlineNews.filter(
          (article: NewsArticle) => article.id !== id
        );
        localStorage.setItem("offline_news", JSON.stringify(updatedNews));
        setArticles(updatedNews);
        setDeleteConfirm(null);
        setDeleteSuccess("Article was deleted from local storage successfully");
        setTimeout(() => setDeleteSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting offline news:", error);
        setError("Failed to delete news from local storage");
      }
    } else {
      try {
        setDeleteInProgress(true);
        setError(null);

        // Use the newsService instead of direct API call
        await newsService.deleteArticle(id);

        // Filter out the deleted article from state
        setArticles(articles.filter((article) => article.id !== id));
        setDeleteConfirm(null);
        setDeleteSuccess("Article was deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => setDeleteSuccess(null), 3000);
      } catch (err: any) {
        console.error("Failed to delete news article:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete news article";
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

  return (
    <div>
      <AdminPageHeader
        title="News Articles"
        description="Manage news articles"
        actionButton={
          <Link
            to="/admin/news/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add New Article
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
                Search Articles
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
                placeholder="Search by title, content, or category..."
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
                {articles.length === 0
                  ? "No articles found matching your search."
                  : `Found ${articles.length} article${
                      articles.length !== 1 ? "s" : ""
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
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 py-8">
            No articles found. Click "Add New Article" to create your first
            article.
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
                  Article
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
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {article.image_url && (
                        <img
                          className="h-10 w-10 rounded-full object-cover mr-3"
                          src={getImageUrl(article.image_url, article.title)}
                          alt={article.title}
                          onError={(e) => {
                            console.log(
                              "Image failed to load:",
                              article.image_url
                            );
                            e.currentTarget.src =
                              "/images/news/placeholder.jpg";
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {article.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        article.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {article.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      {deleteConfirm === article.id ? (
                        <>
                          <span className="text-red-600 mr-2">
                            Confirm delete?
                          </span>
                          <button
                            onClick={() => handleDelete(article.id)}
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
                            to={`/admin/news/${article.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => confirmDelete(article.id)}
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

export default NewsList;
