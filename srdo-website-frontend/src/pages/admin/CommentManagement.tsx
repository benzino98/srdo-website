import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../contexts/AuthContext";
import { ApiResponse, PaginatedApiResponse } from "../../types/api";
import axios from "axios";

interface Comment {
  id: number;
  content: string;
  is_approved: boolean;
  created_at: string;
  commentable_type: string;
  commentable_id: number;
  user?: {
    id: number;
    name: string;
  };
  guest_name?: string;
}

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { get, put, del } = useApi<PaginatedApiResponse<Comment>>();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        console.error("Not authenticated");
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("srdo_token");

      try {
        // Get the raw response first
        const response = await get("/comments?approved=0");

        // Handle the response more carefully
        let commentsData: Comment[] = [];

        // Check if we got an array directly
        if (Array.isArray(response)) {
          commentsData = response;
        }
        // Check if we have a nested data property that's an array
        else if (response?.data && Array.isArray(response.data)) {
          commentsData = response.data;
        }
        // Check if we have a doubly nested data.data that's an array
        else if (response?.data?.data && Array.isArray(response.data.data)) {
          commentsData = response.data.data;
        }
        // Handle other potential response formats
        else if (response && typeof response === "object") {
          // Try to find any array in the response using type-safe approach
          const responseObj = response as Record<string, any>;
          for (const key in responseObj) {
            if (Array.isArray(responseObj[key])) {
              commentsData = responseObj[key];
              break;
            }
            // Look one level deeper
            if (responseObj[key] && typeof responseObj[key] === "object") {
              const nestedObj = responseObj[key] as Record<string, any>;
              for (const nestedKey in nestedObj) {
                if (Array.isArray(nestedObj[nestedKey])) {
                  commentsData = nestedObj[nestedKey];
                  break;
                }
              }
            }
          }
        }

        // Last resort - use a direct axios call
        if (commentsData.length === 0) {
          // Get the base URL
          const baseUrl =
            process.env.REACT_APP_API_URL || "http://localhost:8000/api";

          // Create an axios instance
          const axiosInstance = axios.create({
            baseURL: "", // Empty base URL to avoid defaults
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          // Make a direct GET request
          const fullUrl = `${baseUrl}/comments?approved=0`;

          const axiosResponse = await axiosInstance.get(fullUrl);

          if (axiosResponse.status === 200 && axiosResponse.data) {
            // Try to find comments in the response
            if (Array.isArray(axiosResponse.data)) {
              commentsData = axiosResponse.data;
            } else if (
              axiosResponse.data.data &&
              Array.isArray(axiosResponse.data.data)
            ) {
              commentsData = axiosResponse.data.data;
            }
          }
        }

        // Log what we found

        // Update state with the comments
        setComments(commentsData);

        // If we still didn't find any comments, check if that's expected
        if (commentsData.length === 0) {
        }
      } catch (apiError) {
        console.error("API request failed:", apiError);
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (err: any) {
      console.error("Error loading comments:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError(`Failed to load comments: ${errorMessage}`);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const approveComment = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (!isAuthenticated) {
        console.error("Not authenticated");
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      // Using direct axios call instead of useApi hook
      try {
        // Get auth token
        const token = localStorage.getItem("srdo_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Get the base URL
        const baseUrl =
          process.env.REACT_APP_API_URL || "http://localhost:8000/api";

        // Create an axios instance
        const axiosInstance = axios.create({
          baseURL: "", // Empty base URL to avoid defaults
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // Include cookies for CSRF token
        });

        // Make the PUT request
        const fullUrl = `${baseUrl}/comments/${id}/approve`;

        const response = await axiosInstance.put(fullUrl);

        if (response.status >= 200 && response.status < 300) {
          setSuccessMessage("Comment approved successfully");

          // Remove the comment from the list
          setComments(comments.filter((comment) => comment.id !== id));
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (axiosError: any) {
        console.error("Error with direct API call:", axiosError);
        throw axiosError;
      }
    } catch (err: any) {
      console.error("Error approving comment:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError(`Failed to approve comment: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (!isAuthenticated) {
        console.error("Not authenticated");
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      // Using direct axios call instead of useApi hook
      try {
        // Get auth token
        const token = localStorage.getItem("srdo_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Get the base URL
        const baseUrl =
          process.env.REACT_APP_API_URL || "http://localhost:8000/api";

        // Create an axios instance
        const axiosInstance = axios.create({
          baseURL: "", // Empty base URL to avoid defaults
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // Include cookies for CSRF token
        });

        // Make the DELETE request
        const fullUrl = `${baseUrl}/comments/${id}`;

        const response = await axiosInstance.delete(fullUrl);

        if (response.status >= 200 && response.status < 300) {
          setSuccessMessage("Comment deleted successfully");

          // Remove the comment from the list
          setComments(comments.filter((comment) => comment.id !== id));
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (axiosError: any) {
        console.error("Error with direct API call:", axiosError);
        throw axiosError;
      }
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Unknown error";
      setError(`Failed to delete comment: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getCommentableTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      "App\\Models\\News": "News Article",
      "App\\Models\\Project": "Project",
      "App\\Models\\Resource": "Resource",
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !comments.length) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Comment Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Pending Comments</h2>
          <p className="text-gray-600">
            Approve or delete comments before they appear on the site
          </p>
        </div>

        {comments.length === 0 && !loading ? (
          <div className="p-6 text-center text-gray-500">
            No pending comments to approve.
          </div>
        ) : (
          <div className="divide-y">
            {comments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-medium text-gray-800">
                      {comment.user?.name || comment.guest_name || "Anonymous"}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCommentableTypeLabel(comment.commentable_type)}
                    </span>
                  </div>
                </div>

                <div className="text-gray-700 mb-4">{comment.content}</div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => approveComment(comment.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    disabled={loading}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentManagement;
