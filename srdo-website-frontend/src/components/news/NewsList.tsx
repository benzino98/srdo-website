import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import newsService from "../../services/newsService";
import { NewsArticle } from "../../types/news";
import ImageWithFallback from "../common/ImageWithFallback";
import { PaginatedApiResponse } from "../../types/api";
import { useAuth } from "../../contexts/AuthContext";

// Update interface to match actual API response
interface NewsResponse {
  // Allow any array to prevent type errors
  data: NewsArticle[] | any[];
  current_page?: number;
  last_page?: number;
  total?: number;
  // Add fallbacks for different API response formats
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: string;
  author?: {
    id: number;
    name: string;
  };
}

interface NewsListProps {
  category?: string;
}

// Function to ensure proper URL format for images
const getImageUrl = (
  imageUrl: string | null | undefined,
  articleTitle?: string,
  category?: string
): string => {
  if (!imageUrl) {
    // Use local fallback image

    return "/images/news/placeholder.jpg";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it starts with '/images', it's a local image
  if (imageUrl.startsWith("/images")) {
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
  const fullUrl = `${baseUrl}/storage/news/${cleanPath}`;

  return fullUrl;
};

const NewsList: React.FC<NewsListProps> = ({ category = "All" }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole && hasRole("admin");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [manualLoading, setManualLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [data, setData] = useState<NewsResponse | null>(null);
  const [renderFallback, setRenderFallback] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi<PaginatedApiResponse<NewsItem>>();

  // Reference to track the latest page requested
  const latestPageRef = useRef(1);
  // Store all news articles to handle pagination locally
  const [allNewsCache, setAllNewsCache] = useState<NewsItem[]>([]);
  // Set a fixed number of news articles per page
  const perPage = 9;

  // Categories definition (moved to top of component)
  const categories = [
    "All",
    "Press Releases",
    "News",
    "Events",
    "Announcements",
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use either API loading state or manual loading state
  const loadingNews = loading || manualLoading;

  // Get current page of news articles from cache
  function getNewsForCurrentPage(): NewsItem[] {
    if (!allNewsCache || allNewsCache.length === 0) return [];

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return allNewsCache.slice(startIndex, endIndex);
  }

  // Calculate total pages based on cache
  const calculateTotalPages = (): number => {
    if (!allNewsCache || allNewsCache.length === 0) return 1;
    return Math.ceil(allNewsCache.length / perPage);
  };

  // Use calculated pagination instead of API pagination
  const totalPages = calculateTotalPages();
  const totalItems = allNewsCache.length;

  // Handle different possible API response formats
  // Use client-side pagination with our cache instead of the original articles
  const articles = getNewsForCurrentPage();
  const pagination = {
    total_pages: totalPages,
    total: totalItems,
    current_page: currentPage,
  };

  // Update selectedCategory when category prop changes
  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  // Debug the current state

  // Log image URLs to debug
  useEffect(() => {
    if (data && data.data && data.data.length > 0) {
      data.data.forEach((article: NewsItem) => {
        // Test constructing the image URL
        if (article.image_url) {
          const constructedUrl = getImageUrl(
            article.image_url,
            article.title,
            category
          );
        }
      });
    }
  }, [data, category]);

  const loadNews = async () => {
    try {
      setManualLoading(true);
      setDatabaseError(false);
      setRenderFallback(false);
      setError(null); // Reset error state before attempting to load

      const params = {
        page: 1, // Always request page 1 since we're loading all articles
        category: category !== "All" ? category : undefined,
        search: searchTerm || undefined,
        per_page: 100, // Increase to ensure all news articles are fetched
      };

      const result = await get("/news", { params });

      // Handle the specific backend format where data is directly in result.data, not result.data.data
      if (result?.data) {
        let newsData;
        let paginationData;

        // Check if it's the Laravel paginated format
        if (result.data.data && Array.isArray(result.data.data)) {
          // Standard format with nested data
          newsData = result.data.data;
          paginationData = {
            current_page:
              result.data.current_page || result.data.meta?.current_page,
            last_page: result.data.last_page || result.data.meta?.last_page,
            total: result.data.total || result.data.meta?.total,
          };
        } else if (result.data.current_page && Array.isArray(result.data)) {
          // Laravel paginator format
          newsData = result.data;
          paginationData = {
            current_page: result.data.current_page,
            last_page: result.data.last_page,
            total: result.data.total,
          };
        } else if (Array.isArray(result.data)) {
          // Simple array format
          newsData = result.data;
          paginationData = {
            current_page: 1,
            last_page: 1,
            total: result.data.length,
          };
        } else {
          // Backend format: result.data contains the entire pagination object including "data" array
          newsData = result.data.data || [];
          paginationData = {
            current_page: result.data.current_page,
            last_page: result.data.last_page,
            total: result.data.total,
          };
        }

        if (Array.isArray(newsData) && newsData.length > 0) {
          // Update both state variables with the correct data
          setData({
            data: newsData,
            ...paginationData,
          });
          setNews(newsData);

          // Store all news articles in cache for client-side pagination
          setAllNewsCache(newsData);
        } else {
          setNews([]);
          setData(null);
          setError("No news articles found");
        }
      } else {
        setData(null);
        setNews([]);
        setError("Failed to retrieve news data from the server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load news");
      setData(null);
      setNews([]);
    } finally {
      setManualLoading(false);
      setLoading(false); // Ensure loading state is set to false even if there's an error
    }
  };

  useEffect(() => {
    loadNews();
    // Debug log to track when loadNews is called
  }, [category, searchTerm]); // Remove currentPage from dependencies

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
  };

  const handlePageChange = (page: number) => {
    // Update the page ref immediately
    latestPageRef.current = page;
    // Update the UI state
    setCurrentPage(page);
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Sample fallback data for when API fails
  const fallbackNews = [
    {
      id: 1,
      title: "Sample News Article 1",
      slug: "sample-news-1",
      excerpt:
        "This is a sample news article that appears when the API is not available.",
      content: "Full content would go here.",
      image_url: "/images/news/placeholder.jpg",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Sample News Article 2",
      slug: "sample-news-2",
      excerpt:
        "Another sample article for testing the UI when the database is down.",
      content: "More content would go here.",
      image_url: "/images/news/placeholder.jpg",
      created_at: new Date().toISOString(),
    },
  ];

  const renderArticles = () => {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return <div className="text-center py-4">No articles available</div>;
    }

    // Create a new array of valid article elements
    const articleElements: React.ReactElement[] = [];

    articles.forEach((article: NewsItem) => {
      if (!article || !article.id) {
        return; // Skip this iteration
      }

      articleElements.push(
        <motion.div
          key={article.id}
          className="news-item bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to={`/news/${article.slug}`} className="block">
            <div className="h-56 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
              <ImageWithFallback
                src={getImageUrl(article.image_url)}
                fallbackSrc="/images/news/placeholder.jpg"
                alt={article.title}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </div>
          </Link>
          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {article.category || "News"}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(article.created_at).toLocaleDateString()}
              </span>
            </div>
            <Link to={`/news/${article.slug}`} className="block">
              <h3 className="text-xl font-bold mb-2 hover:text-blue-600 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                {article.excerpt || article.content}
              </p>
            </Link>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="flex space-x-2">
                <Link
                  to={`/news/${article.slug}`}
                  className="inline-flex items-center text-green-600 hover:text-green-800 font-medium text-sm"
                >
                  Read more →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      );
    });

    return articleElements;
  };

  // Replace the return section with this updated version
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and filter section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Category filters on the left */}
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat
                    ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar on the right */}
          <form
            onSubmit={handleSearch}
            className="flex gap-4 w-full md:w-auto md:max-w-md"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchInputChange}
              placeholder="Search news..."
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

      {/* News articles grid */}
      {loadingNews ? (
        <div className="text-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news articles...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 px-4 max-w-md mx-auto bg-red-50 rounded-lg border border-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : (
        (() => {
          return (
            <>
              {articles && articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {renderArticles()}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 5-7-5m14 6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v2m2 4h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg">
                    No news articles found.
                  </p>
                </div>
              )}

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
            </>
          );
        })()
      )}
    </div>
  );
};

export default NewsList;
