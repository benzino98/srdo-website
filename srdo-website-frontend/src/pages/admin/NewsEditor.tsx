import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../../hooks/useApi";
import { NewsArticle } from "../../types/news";
import { ApiResponse } from "../../types/api";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import authService from "../../services/authService";
import newsService from "../../services/newsService";

interface NewsFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  is_published: boolean;
}

const categories = ["news", "update", "press"];

// Function to ensure proper URL format for images
const getImageUrl = (imageUrl: string | null | undefined): string => {
  console.log("Processing image URL:", imageUrl);

  if (!imageUrl) {
    console.log("No image URL provided, returning empty string");
    return "";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    console.log("URL is already absolute:", imageUrl);
    return imageUrl;
  }

  // If it's a data URL (from file input preview), return as is
  if (imageUrl.startsWith("data:")) {
    console.log("Image is a data URL, returning as is");
    return imageUrl;
  }

  // Get backend base URL without any /api segments
  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
  const baseUrl = apiUrl.replace(/\/api.*$/, "").replace(/\/+$/, "");
  console.log("Base URL for image:", baseUrl);

  // Clean up the image path to ensure it starts with /
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  console.log("Cleaned image path:", cleanPath);

  // Construct the full URL
  const fullUrl = `${baseUrl}${cleanPath}`;
  console.log("Constructed full image URL:", fullUrl);
  return fullUrl;
};

const NewsEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { get, post, put } = useApi<NewsArticle>();
  const { logout, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    content: "",
    excerpt: "",
    category: categories[0],
    author: "",
    is_published: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (isEditing) {
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching article with ID:", id);

      // Add detailed debugging for API and authentication
      console.log("API Base URL:", process.env.REACT_APP_API_URL);
      console.log(
        "Authentication status:",
        isAuthenticated ? "Authenticated" : "Not authenticated"
      );

      // Try using direct newsService call first
      try {
        console.log("Attempting to fetch article using newsService...");
        const response = await newsService.getArticle(id!);
        console.log("Article fetched with newsService:", response);

        if (response && response.data) {
          const article = response.data;
          console.log("Article data:", article);

          if (article.published_at) {
            article.published_at = article.published_at.split("T")[0];
          }

          setFormData({
            title: article.title || "",
            content: article.content || "",
            excerpt: article.excerpt || "",
            category: article.category || categories[0],
            author: article.author?.name || "",
            is_published: !!article.published_at,
          });

          if (article.image_url) {
            const fullImageUrl = getImageUrl(article.image_url);
            console.log(
              "Setting image preview with processed URL:",
              fullImageUrl
            );
            setImagePreview(fullImageUrl);
          }

          return; // Success! We can exit the function
        }
      } catch (serviceError) {
        console.warn(
          "Failed to fetch with newsService, falling back to useApi hook:",
          serviceError
        );
        // Continue to the useApi approach
      }

      // Original approach using useApi hook
      const response = await get(`/news/${id}`);
      console.log("Raw API response:", response);

      // More detailed inspection of the response structure
      if (response) {
        console.log("Response structure:", {
          hasData: !!response.data,
          dataType: response.data ? typeof response.data : "undefined",
          isDataObject: response.data
            ? typeof response.data === "object"
            : false,
        });
      }

      // Check if response exists and has data property with actual content
      if (
        response &&
        response.data &&
        typeof response.data === "object" &&
        Object.keys(response.data).length > 0
      ) {
        const article = response.data;
        if (article.published_at) {
          article.published_at = article.published_at.split("T")[0];
        }

        console.log("Setting form data with:", article);
        setFormData({
          title: article.title || "",
          content: article.content || "",
          excerpt: article.excerpt || "",
          category: article.category || categories[0],
          author: article.author?.name || "",
          is_published: !!article.published_at,
        });

        if (article.image_url) {
          const fullImageUrl = getImageUrl(article.image_url);
          console.log(
            "Setting image preview with processed URL:",
            fullImageUrl
          );
          setImagePreview(fullImageUrl);
        }
      } else {
        // More specific error handling for empty response
        console.error("Invalid or empty article data received");

        if (response && response.data === null) {
          setError(
            "The article could not be found. It may have been deleted or there might be an issue with the database connection."
          );
        } else if (
          response &&
          (response.data === undefined ||
            Object.keys(response.data).length === 0)
        ) {
          setError(
            "The API returned an empty response. The article may exist but could not be loaded properly."
          );
        } else {
          setError(
            "Failed to load article data: No data received from the server."
          );
        }
      }
    } catch (error: any) {
      console.error("Error fetching article:", error);

      // Check if it's a 404 Not Found error or model not found error
      const isNotFoundError =
        error?.response?.status === 404 ||
        error?.message?.includes("No query results") ||
        error?.response?.data?.message?.includes("No query results");

      if (isNotFoundError) {
        setError(
          "The article you're trying to edit doesn't exist or may have been deleted. " +
            "Please return to the news list and select another article."
        );
      } else {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load article";
        setError(`Error loading article: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // For editing existing articles, use a direct JSON approach
      if (isEditing) {
        await updateExistingArticle();
      }
      // For new articles, continue using FormData for file uploads
      else {
        await createNewArticle();
      }

      setSuccess("Article saved successfully!");
      setTimeout(() => {
        navigate("/admin/news");
      }, 2000);
    } catch (error: any) {
      console.error("Error saving article:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save article";
      setError(`Error saving article: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Create a new article using FormData (for file uploads)
  const createNewArticle = async () => {
    const formDataToSend = new FormData();

    // Add each field explicitly with the correct type handling
    formDataToSend.append("title", formData.title);
    formDataToSend.append("content", formData.content);
    formDataToSend.append("excerpt", formData.excerpt || "");
    formDataToSend.append("category", formData.category);
    formDataToSend.append("author", formData.author || "");

    // Fix is_published field handling
    formDataToSend.append("is_published", formData.is_published ? "1" : "0");
    formDataToSend.append("published", formData.is_published ? "1" : "0");
    formDataToSend.append(
      "published_at",
      formData.is_published ? new Date().toISOString() : ""
    );
    formDataToSend.append(
      "status",
      formData.is_published ? "published" : "draft"
    );
    formDataToSend.append("is_draft", !formData.is_published ? "1" : "0");

    // Add image if available
    if (imageFile) {
      formDataToSend.append("image", imageFile);
    }

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      onUploadProgress: (progressEvent: any) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      },
      withCredentials: true,
    };

    try {
      const response = await newsService.createArticle(formDataToSend);
      console.log("Article created successfully:", response);
    } catch (error) {
      console.error("Failed to create article with newsService:", error);
      const response = await post("/news", formDataToSend, config);
      console.log("Article created successfully with useApi hook:", response);
    }
  };

  // Update an existing article using direct JSON (to avoid FormData issues)
  const updateExistingArticle = async () => {
    // Prepare JSON data
    const jsonData = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || "",
      category: formData.category,
      author: formData.author || "",
      is_published: formData.is_published, // Send as boolean
      published: formData.is_published, // Alternative
      published_at: formData.is_published ? new Date().toISOString() : null,
      status: formData.is_published ? "published" : "draft",
      is_draft: !formData.is_published,
      keep_existing_image: !imageFile && !!imagePreview ? 1 : 0,
    };

    console.log("Updating article with JSON data:", jsonData);

    // Try all available methods to update the article
    try {
      // First try the newsService JSON method
      console.log("Attempting to update with newsService.updateArticleJson...");
      const response = await newsService.updateArticleJson(id!, jsonData);
      console.log(
        "Article updated successfully with newsService JSON:",
        response
      );
      return response;
    } catch (serviceJsonError) {
      console.warn(
        "Failed to update with newsService JSON method:",
        serviceJsonError
      );

      // Next try the regular newsService FormData method
      if (imageFile) {
        try {
          console.log(
            "Trying newsService.updateArticle with FormData for image..."
          );
          const formDataToSend = new FormData();

          // Add basic fields to FormData
          Object.entries(jsonData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              // Convert booleans to "0"/"1" strings for FormData
              if (typeof value === "boolean") {
                formDataToSend.append(key, value ? "1" : "0");
              } else {
                formDataToSend.append(key, String(value));
              }
            }
          });

          // Add image
          formDataToSend.append("image", imageFile);

          const formDataResponse = await newsService.updateArticle(
            id!,
            formDataToSend
          );
          console.log(
            "Article updated with newsService FormData:",
            formDataResponse
          );
          return formDataResponse;
        } catch (serviceFormError) {
          console.warn(
            "Failed with newsService FormData method:",
            serviceFormError
          );
          // Continue to direct axios
        }
      }

      // Try direct axios as a last resort
      try {
        // Get API URL and add /news/ID endpoint
        const apiUrl =
          process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
        const endpoint = `${apiUrl}/news/${id}`;
        console.log("Making direct axios PUT request to:", endpoint);

        // Get authentication token
        const token = localStorage.getItem("srdo_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // First fetch CSRF token
        try {
          const baseUrl = apiUrl
            .replace(/\/api\/v1$/, "")
            .replace(/\/api$/, "");
          await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
            withCredentials: true,
          });
          console.log("CSRF token fetched successfully");
        } catch (csrfError) {
          console.error("Failed to fetch CSRF token:", csrfError);
          // Continue anyway
        }

        // Make update request with JSON
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          Authorization: `Bearer ${token}`,
        };

        // Special case: convert is_published to integer string format explicitly
        const modifiedJsonData = {
          ...jsonData,
          is_published: formData.is_published ? "1" : "0",
        };

        const response = await axios.put(endpoint, modifiedJsonData, {
          headers,
          withCredentials: true,
        });

        console.log(
          "Article updated successfully with direct axios:",
          response
        );
        return response.data;
      } catch (axiosError) {
        console.error("All update methods failed:", axiosError);
        throw axiosError;
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("New image selected:", {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      });

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        console.log("Image preview generated successfully");
        setImagePreview(previewUrl);
      };
      reader.onerror = () => {
        console.error("Error reading file:", reader.error);
        setError("Could not load image preview. Please try a different image.");
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected or file selection canceled");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AdminPageHeader
          title={isEditing ? "Edit Article" : "Create New Article"}
          description={
            isEditing ? "Update article details" : "Add a new article"
          }
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="mb-2">{error}</p>
            <button
              onClick={() => navigate("/admin/news")}
              className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            >
              Return to News List
            </button>
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
                htmlFor="excerpt"
                className="block text-sm font-medium text-gray-900"
              >
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-900"
              >
                Content
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-900"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-900"
                >
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Article Image
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview}
                      alt="Article preview"
                      className="object-cover w-full h-full rounded-lg border border-gray-200"
                      onError={(e) => {
                        console.error(
                          "Error loading image preview:",
                          imagePreview
                        );
                        // Hide the broken image by setting display to none
                        (e.target as HTMLImageElement).style.display = "none";
                        // Try to log what might be wrong with the URL
                        if (imagePreview.startsWith("/")) {
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_published"
                className="ml-2 block text-sm text-gray-900"
              >
                Publish article
              </label>
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
                onClick={() => navigate("/admin/news")}
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
                  ? "Update Article"
                  : "Create Article"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsEditor;
