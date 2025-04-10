import React, { useEffect, useState, ErrorInfo, Component } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../../hooks/useApi";
import { NewsArticle } from "../../types/news";
import Comments from "../common/Comments";
import ImageWithFallback from "../common/ImageWithFallback";
import newsService from "../../services/newsService";

// Error Boundary to catch runtime errors
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NewsDetail error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="bg-red-100 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but an error occurred while displaying this article.
            </p>
            {this.state.error && (
              <p className="text-sm text-gray-500 mb-6 bg-gray-100 p-3 rounded-lg">
                {this.state.error.message}
              </p>
            )}
            <Link
              to="/news"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Return to News
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Function to ensure proper URL format for images
const getImageUrl = (
  imageUrl: string | null | undefined,
  articleTitle?: string,
  category?: string
): string => {
  console.log("Processing image URL:", imageUrl);

  if (!imageUrl) {
    // Use local fallback image
    return "/images/news/placeholder.jpg";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    console.log("URL is already absolute:", imageUrl);
    return imageUrl;
  }

  // If it starts with '/images', it's a local image
  if (imageUrl.startsWith("/images")) {
    console.log("Using local image:", imageUrl);
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
  console.log("✅ Constructed storage URL:", fullUrl);
  return fullUrl;
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Function to calculate approximate reading time
const calculateReadingTime = (content: string): string => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readingTime} min read`;
};

// Safe access utility
const safeValue = (value: any, defaultValue: any) => {
  try {
    // Check for undefined/null
    if (value === undefined || value === null) {
      return defaultValue;
    }

    // For strings, check if it's empty
    if (typeof value === "string" && value.trim() === "") {
      return defaultValue;
    }

    return value;
  } catch (e) {
    console.error("Error accessing value:", e);
    return defaultValue;
  }
};

// Wrap the exported component with error boundary
export default function NewsDetailWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <NewsDetail />
    </ErrorBoundary>
  );
}

// Define the original component but don't export it directly
const NewsDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: article,
    loading,
    error,
    execute: fetchArticle,
    setData: setArticle,
    setError: setArticleError,
  } = useApi<NewsArticle>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return;

      console.log("Fetching article with slug:", slug);
      setIsLoading(true);

      try {
        // Method 1: Try using the newsService
        try {
          console.log("Method 1: Using newsService to fetch article");
          const response = await newsService.getArticleBySlug(slug);

          if (response && response.data) {
            console.log(
              "Article successfully fetched with newsService:",
              response.data
            );

            // Debug the data structure we received
            console.log("Data structure check:", {
              has_id: Boolean(response.data.id),
              has_title: Boolean(response.data.title),
              has_content: Boolean(response.data.content),
              has_created_at: Boolean(response.data.created_at),
              has_updated_at: Boolean(response.data.updated_at),
              is_published_field: response.data.is_published,
              published_at_field: response.data.published_at,
            });

            // Data is already transformed in the service, just set it directly
            setArticle(response.data);
            return; // Exit if successful
          } else {
            console.error("Invalid response format or empty data:", response);
          }
        } catch (serviceError: any) {
          const errorDetails = {
            message: serviceError?.message || "Unknown error",
            response: serviceError?.response?.data,
            status: serviceError?.response?.status,
          };
          console.error("newsService method failed:", errorDetails);
        }

        // Method 2: Try using the API hook directly
        try {
          console.log("Method 2: Using useApi hook directly");
          const response = await fetchArticle("GET", `/news/slug/${slug}`);

          if (response && response.data) {
            console.log(
              "Article successfully fetched with useApi hook:",
              response.data
            );

            // The data is set automatically by the hook, but we need to ensure all required fields are present
            return; // Exit if successful
          }
        } catch (apiError: any) {
          console.error(
            "useApi hook method failed:",
            apiError?.message || apiError
          );
          throw apiError; // Propagate this error if both methods fail
        }

        // If we get here, both methods failed but didn't throw (e.g., returned null data)
        throw new Error("Could not retrieve article data from either method");
      } catch (err: any) {
        console.error("All article fetch methods failed:", err?.message || err);
        setArticleError({
          message: "Failed to load article. Please try again later.",
          status: 404,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [slug, fetchArticle, setArticle, setArticleError]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Use combined loading state
  const isPageLoading = loading || isLoading;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Article Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find the article you're looking for. It may have been
            removed or renamed.
          </p>
          <p className="text-sm text-gray-500 mb-6 bg-gray-100 p-3 rounded-lg">
            Technical details: {error.message || "Unknown error"}
          </p>
          <Link
            to="/news"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Browse All News
          </Link>
        </div>
      </div>
    );
  }

  // Only proceed when we have a valid article with required data
  if (!article || !article.title || !article.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-lg">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {article ? "Article Content Missing" : "Article Not Found"}
          </h1>
          <p className="text-gray-600 mb-6">
            {article
              ? "We found the article but it's missing essential content."
              : `We couldn't find the article with slug "${slug}". It may have been removed or renamed.`}
          </p>
          <Link
            to="/news"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Browse News
          </Link>
        </div>
      </div>
    );
  }

  // Safely calculate reading time - protect against null content
  const readingTime = calculateReadingTime(article.content || "");

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Hero Section with Image */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={getImageUrl(
              safeValue(article.image_url, null),
              safeValue(article.title, ""),
              safeValue(article.category, "")
            )}
            fallbackSrc="/images/news/placeholder.jpg"
            alt={safeValue(article.title, "Article Image")}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"></div>
        </div>

        <div className="container mx-auto px-4 h-full flex items-end pb-16 relative z-10">
          <div className="max-w-4xl">
            <Link
              to="/news"
              className="inline-flex items-center text-white/90 mb-6 hover:text-white transition-colors group"
            >
              <svg
                className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Back to News
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {safeValue(article.title, "Untitled Article")}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                {formatDate(
                  safeValue(article.created_at, new Date().toISOString())
                )}
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {readingTime}
              </span>
              {safeValue(article.category, null) && (
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    ></path>
                  </svg>
                  {article.category}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              {/* Article Info */}
              <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-100 pb-8">
                {article.author && article.author.name && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl mr-4">
                      {article.author.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {article.author.name}
                      </p>
                      <p className="text-sm text-gray-500">Author</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-start mt-4 sm:mt-0">
                  <p className="text-sm text-gray-500">Published on</p>
                  <p className="font-medium text-gray-700 mt-1">
                    {article.published_at
                      ? formatDate(article.published_at)
                      : "Not published yet"}
                  </p>
                </div>
              </div>

              {/* Article Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mb-12"
              >
                <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600">
                  {article.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      No content available for this article.
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Tags Section if available */}
              {article.category && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mb-8 pt-8 border-t border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Related Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/news?category=${article.category}`}
                      className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-full text-sm text-gray-800"
                    >
                      {article.category}
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Comments Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-12 pt-8 border-t border-gray-200"
              >
                {/* Ensure we have a valid article ID before rendering Comments */}
                {article && article.id ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-2xl font-semibold mb-2">
                        Discussion
                      </h3>
                      <p className="text-gray-600">
                        Share your thoughts on this article
                      </p>
                    </div>

                    {/* Pass numeric ID to Comments component */}
                    <Comments
                      type="news"
                      itemId={Number(safeValue(article.id, 0))}
                    />
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    Comments cannot be loaded at this time.
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              to="/news"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-full text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Explore More News
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
