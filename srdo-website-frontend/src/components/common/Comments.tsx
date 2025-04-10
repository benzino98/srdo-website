import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useApi } from "../../hooks/useApi";
import axios from "axios";

interface Comment {
  id: number;
  content: string;
  is_approved: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
  guest_name?: string;
  likes?: number;
  dislikes?: number;
  replies?: Comment[];
}

interface ApiResponse {
  data?: {
    comments?: Comment[];
    error?: { message: string };
    message?: string;
  };
  error?: { message: string };
  message?: string;
}

// Sort comments by likes (most liked first)
const sortByTop = (a: Comment, b: Comment): number =>
  (b.likes || 0) - (a.likes || 0);

// Sort comments by date (newest first)
const sortByNewest = (a: Comment, b: Comment): number =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

interface CommentsProps {
  type: "news" | "projects" | "resources";
  itemId: number;
}

// Process API comments - keep reference separate from the component
const processAPIComments = (apiComments: Comment[], savedStats: any[]) => {
  console.log(
    `Processing ${apiComments.length} comments with ${
      savedStats?.length || 0
    } saved stats`
  );

  return apiComments.map((comment) => {
    // Look for saved stats for this comment
    const commentStats = savedStats.find((stat) => stat.id === comment.id);

    if (commentStats) {
      console.log(`Found saved stats for comment ${comment.id}:`, commentStats);
      return {
        ...comment,
        likes: commentStats.likes || 0,
        dislikes: commentStats.dislikes || 0,
        replies: commentStats.replies || [],
      };
    }

    // Default values for new comments
    return {
      ...comment,
      likes: 0,
      dislikes: 0,
      replies: [],
    };
  });
};

const Comments: React.FC<CommentsProps> = ({ type, itemId }) => {
  // Load saved comment stats on component initialization
  const loadInitialCommentStats = () => {
    try {
      const storageKey = `${type}_${itemId}_comments_stats`;
      const savedStatsString = localStorage.getItem(storageKey);
      console.log(`On init - checking localStorage key: ${storageKey}`);

      if (savedStatsString) {
        const savedStats = JSON.parse(savedStatsString);
        console.log(`Found saved comment stats:`, savedStats);
        return savedStats;
      } else {
        console.log(`No saved comment stats found for ${storageKey}`);
        return [];
      }
    } catch (error) {
      console.error("Error loading initial comment stats:", error);
      return [];
    }
  };

  // Initialize comments with saved localStorage data if available
  const initialCommentStats = loadInitialCommentStats();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { get, post } = useApi<{ data: Comment[] }>();
  const { isAuthenticated, user } = useAuth();

  // Load saved interactions from localStorage
  const [likedComments, setLikedComments] = useState<
    Record<number, "like" | "dislike" | null>
  >(() => {
    try {
      const storageKey = `${type}_${itemId}_likes`;
      console.log(`On init - checking localStorage for likes: ${storageKey}`);
      const savedLikes = localStorage.getItem(storageKey);
      if (savedLikes) {
        console.log(`Found saved likes:`, JSON.parse(savedLikes));
        return JSON.parse(savedLikes);
      } else {
        console.log(`No saved likes found for ${storageKey}`);
        return {};
      }
    } catch (error) {
      console.error("Error loading saved likes:", error);
      return {};
    }
  });

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [totalComments, setTotalComments] = useState(0);
  const [sortBy, setActiveSort] = useState<"newest" | "top">("top");
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  // Save liked comments to localStorage whenever they change
  useEffect(() => {
    try {
      const storageKey = `${type}_${itemId}_likes`;
      localStorage.setItem(storageKey, JSON.stringify(likedComments));
      console.log(
        `Saved likes to localStorage with key: ${storageKey}`,
        likedComments
      );
    } catch (error) {
      console.error("Error saving likes to localStorage:", error);
    }
  }, [likedComments, type, itemId]);

  // Generate a color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    // Sum the character codes to get a consistent color
    const charSum = name
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  // Fix the forceRefresh function to use the correct URL structure with explicit v1
  const forceRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("FORCE REFRESHING comments with direct API call");
      console.log(`Content type: ${type}, Item ID: ${itemId}`);
      console.log(`ItemId type: ${typeof itemId}, value: ${itemId}`);

      if (!itemId || isNaN(Number(itemId))) {
        console.error("Invalid itemId:", itemId);
        setComments([]);
        setTotalComments(0);
        setError("Invalid content ID");
        setLoading(false);
        return;
      }

      // Explicitly use API URL and add v1 to the path
      const baseUrl =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api"; // Use environment variable
      const directEndpoint = `${baseUrl}/${type}/${itemId}/comments`; // Remove duplicate v1

      // Debug URL construction
      console.log(`BaseURL: "${baseUrl}"`);
      console.log(`Full endpoint with v1: "${directEndpoint}"`);

      // Get auth token - use srdo_token which is what the useApi hook uses
      const token = localStorage.getItem("srdo_token");
      console.log(
        `Using auth token: ${token ? "Yes (found)" : "No (not found)"}`
      );

      // Full explicit URL construction to avoid any middleware or interceptors adding v1
      const fullUrl = `${directEndpoint}?nocache=${Date.now()}`;
      console.log(`Making request to: "${fullUrl}"`);

      // Make direct axios call - avoid any interceptors that might add v1
      const axiosInstance = axios.create({
        baseURL: "", // Empty base URL to avoid defaults
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        validateStatus: (status) => status < 500,
        timeout: 10000, // Increase timeout to 10 seconds
      });

      try {
        // Make request with explicit full URL
        console.log("Sending axios request to:", fullUrl);
        const response = await axiosInstance.get(fullUrl);
        console.log("Full axios response:", response);

        console.log(`Response status: ${response.status}`);

        // Check for error responses
        if (response.status === 401) {
          console.log("⚠️ Unauthorized - but proceeding to show comment form");
          return;
        }

        if (response.status === 404) {
          console.log("⚠️ Comments endpoint not found");
          setComments([]);
          setTotalComments(0);
          setError("Comments are not available for this content.");
          return;
        }

        // Continue with normal processing for successful responses
        if (response.status === 200) {
          console.log("Raw response data:", response.data);

          // Extract comments from response
          let commentsData = [];

          // Add robust null check before accessing data property
          if (response.data) {
            commentsData = response.data.data || response.data;
          } else {
            console.error("Response data is undefined");
          }

          // Ensure we have an array of comments
          if (!Array.isArray(commentsData)) {
            console.error("Comments data is not an array:", commentsData);
            commentsData = [];
          }

          // Filter out any unapproved comments (just in case)
          commentsData = commentsData.filter(
            (comment: Comment) => comment.is_approved
          );

          console.log("Processed comments data:", commentsData);
          console.log(`Found ${commentsData.length} approved comments`);

          // Sort comments based on current sort preference
          const sortedComments = [...commentsData].sort(
            sortBy === "top" ? sortByTop : sortByNewest
          );

          setComments(sortedComments);
          setTotalComments(sortedComments.length);
          setError(null);
        } else {
          console.error("Empty or error response:", response);
          setComments([]);
          setTotalComments(0);
        }
      } catch (axiosError: any) {
        console.error("Error with direct API call:", axiosError);
        throw axiosError;
      }
    } catch (err: any) {
      console.error("Error in force refresh:", err);
      setComments([]);
      setTotalComments(0);

      // Check if this is an auth error
      if (err.response?.status === 401) {
        console.log("Unauthorized error, but proceeding to show comment form");
      } else {
        setError("Failed to load comments. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [type, itemId]);

  // Fix the loadComments function
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Loading comments for ${type}/${itemId}`);
      console.log(`ItemId type: ${typeof itemId}, value: ${itemId}`);

      if (!itemId || isNaN(Number(itemId))) {
        console.error("Invalid itemId in loadComments:", itemId);
        setComments([]);
        setTotalComments(0);
        setError("Invalid content ID");
        setLoading(false);
        return;
      }

      // Load saved stats each time to ensure we have the latest data
      const savedStats = loadInitialCommentStats();
      console.log("Loaded saved stats for applying to comments:", savedStats);

      const apiEndpoint = `/${type}/${itemId}/comments`; // Remove duplicate v1
      console.log(`Using hook to request: ${apiEndpoint}`);

      try {
        const timestampedEndpoint = `${apiEndpoint}?_t=${Date.now()}`;
        console.log(`Making API request to: ${timestampedEndpoint}`);

        const result = await get(timestampedEndpoint);
        console.log("Raw API response:", result);

        if (result) {
          console.log("Received data from API hook:", result);

          let newComments: Comment[] = [];

          if (Array.isArray(result)) {
            newComments = result;
            console.log("Found comments in result array");
          } else {
            const apiResponse = result as ApiResponse;
            // Check if apiResponse exists and has a data property
            if (apiResponse && apiResponse.data) {
              if (
                apiResponse.data.comments &&
                Array.isArray(apiResponse.data.comments)
              ) {
                newComments = apiResponse.data.comments;
                console.log("Found comments in response.data.comments");
              } else if (Array.isArray(apiResponse.data)) {
                newComments = apiResponse.data as Comment[];
                console.log("Found comments in response.data");
              } else {
                console.error("Unexpected response structure:", result);
                newComments = [];
                console.log("No comments found in response");
              }
            } else {
              console.error("API response or data is undefined:", apiResponse);
              newComments = [];
            }
          }

          if (newComments.length > 0) {
            console.log(`Found ${newComments.length} comments`);
            newComments.forEach((comment: Comment, index: number) => {
              console.log(`Comment ${index + 1}:`, {
                id: comment.id,
                is_approved: comment.is_approved,
                content: comment.content?.substring(0, 30) + "...",
                author: comment.user?.name || comment.guest_name || "Anonymous",
              });
            });

            // Filter to only show approved comments
            newComments = newComments.filter(
              (comment: Comment) => comment.is_approved
            );
            console.log(
              `${newComments.length} comments are approved and will be displayed`
            );
          } else {
            console.log("No comments found in response");
          }

          // Process comments to maintain likes/dislikes between refreshes
          const enhancedComments = processAPIComments(newComments, savedStats);

          if (sortBy === "top") {
            enhancedComments.sort(sortByTop);
          } else {
            enhancedComments.sort(sortByNewest);
          }

          setComments(enhancedComments);
          setTotalComments(enhancedComments.length);

          // Make sure to save the loaded comments to localStorage
          console.log("Saving loaded comments to localStorage for persistence");
          saveCommentsStatsToLocalStorage(enhancedComments);
        } else {
          console.log("No data returned from API hook");
          // Remove this automatic forceRefresh call that can cause loops
          // if (!comments.length) {
          //   forceRefresh();
          // }
        }
      } catch (hookError: any) {
        console.error("Error with API hook:", hookError);
        // Only call forceRefresh in case of a real error, not automatically
        // forceRefresh();
      }
    } catch (err: any) {
      console.error("Error loading comments:", err);
      setComments([]);

      if (err.response?.status === 401) {
        console.log("Unauthorized error, but proceeding to show comment form");
      } else {
        setError("Failed to load comments. Please try again later.");
      }

      setTotalComments(0);
    } finally {
      setLoading(false);
    }
    // Remove comments from dependency array to prevent refresh loops
  }, [get, type, itemId, sortBy]);

  // Save initial comments to localStorage after they load
  useEffect(() => {
    if (comments.length > 0) {
      console.log("Saving comments to localStorage after comments update");
      saveCommentsStatsToLocalStorage(comments);
    }
  }, [comments]); // Run whenever comments change, not just when the length changes

  // Load comments on component mount
  useEffect(() => {
    // Only load comments if we have a valid itemId
    if (itemId && !isNaN(Number(itemId))) {
      console.log(`Initial loading of comments for ${type}/${itemId}`);
      loadComments();

      // Check for newly approved comments every 60 seconds
      // This will help show comments that were just approved by an admin
      const newlyApprovedCommentsCheck = setInterval(() => {
        console.log("Checking for newly approved comments...");
        loadComments();
      }, 60000); // Every 60 seconds

      // Cleanup interval on unmount
      return () => clearInterval(newlyApprovedCommentsCheck);
    } else {
      console.error("Invalid itemId on component mount:", itemId);
      setError("Invalid content ID. Cannot load comments.");
    }
  }, [loadComments, type, itemId]);

  // Disable automatic refresh entirely - manual refresh only
  // useEffect(() => {
  //   // Only set up refresh if we have a valid itemId
  //   if (!itemId || isNaN(Number(itemId))) {
  //     return;
  //   }

  //   const interval = setInterval(() => {
  //     if (!loading) {
  //       console.log("Auto-refreshing comments...");
  //       loadComments();
  //     }
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [loadComments, loading, itemId]);

  // Add a manual refresh button to replace automatic refreshing
  const handleRefreshClick = () => {
    if (!loading) {
      loadComments();
    }
  };

  // Handle submit with proper error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }

    if (!isAuthenticated && !guestName.trim()) {
      setError("The name field is required when posting as a guest");
      return;
    }

    if (!itemId || isNaN(Number(itemId))) {
      console.error("Invalid itemId in handleSubmit:", itemId);
      setError("Invalid content ID. Cannot post comment.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const submitEndpoint = `/${type}/${itemId}/comments`; // Remove duplicate v1
      console.log(`Submitting comment to: ${submitEndpoint}`);
      console.log(`Content type: ${type}, Item ID: ${itemId}`);

      const commentData = {
        content: newComment,
        ...((!isAuthenticated && { guest_name: guestName }) || {}),
      };

      console.log("Comment data being submitted:", commentData);

      // Use a more direct approach with axios instead of the useApi hook
      try {
        // Get auth token
        const token = localStorage.getItem("srdo_token");

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

        // Make the POST request
        const fullUrl = `${baseUrl}/${type}/${itemId}/comments`;
        console.log("Sending direct POST request to:", fullUrl);

        const response = await axiosInstance.post(fullUrl, commentData);
        console.log("Direct axios response:", response);

        // Check for success
        if (response.status >= 200 && response.status < 300) {
          setNewComment("");
          if (!isAuthenticated) {
            setGuestName("");
          }

          setSuccessMessage(
            "Comment submitted successfully! It will be visible after approval."
          );

          setTimeout(() => {
            loadComments();
          }, 500);
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (axiosError: any) {
        console.error("Error with direct API call:", axiosError);
        throw axiosError;
      }
    } catch (err: any) {
      console.error("Error posting comment:", err);
      let message = "Failed to post comment";

      if (err.response?.data) {
        if (err.response.data.errors) {
          const errors = err.response.data.errors;
          if (errors.guest_name) {
            message = errors.guest_name[0] || "The name field is required";
          } else if (errors.content) {
            message = errors.content[0] || "The comment content is required";
          } else {
            for (const field in errors) {
              if (errors[field] && errors[field].length > 0) {
                message = errors[field][0];
                break;
              }
            }
          }
        } else if (err.response.data.message) {
          message = err.response.data.message;
        }
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle replying to a comment
  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };

  // Handle submitting a reply
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, you would send this to your API
      // For now, we'll just update the UI

      const newReply = {
        id: Date.now(), // Temporary ID
        content: replyContent,
        is_approved: true,
        created_at: new Date().toISOString(),
        guest_name:
          isAuthenticated && user?.name ? user.name : guestName || "Anonymous",
        likes: 0,
        dislikes: 0,
      };

      // Add the reply to the right comment
      const updatedComments = comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setReplyingTo(null);
      setReplyContent("");

      // Save updated comments with new reply to localStorage
      saveCommentsStatsToLocalStorage(updatedComments);
    } catch (err) {
      console.error("Error posting reply:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle like/dislike
  const handleReaction = (commentId: number, reaction: "like" | "dislike") => {
    console.log(`Handling ${reaction} reaction for comment ID ${commentId}`);

    const currentReaction = likedComments[commentId];
    console.log(
      `Current reaction for comment ${commentId}: ${currentReaction || "none"}`
    );

    let newReaction: "like" | "dislike" | null = null;

    // Toggle reaction if clicking the same button
    if (currentReaction === reaction) {
      console.log(`User clicked ${reaction} again, toggling off`);
      newReaction = null;
    } else {
      console.log(`Setting new reaction to ${reaction}`);
      newReaction = reaction;
    }

    // Save to state
    const updatedLikedComments = {
      ...likedComments,
      [commentId]: newReaction,
    };
    console.log("Setting liked comments to:", updatedLikedComments);
    setLikedComments(updatedLikedComments);

    // Update the comment counts
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        console.log(`Updating counts for comment ID ${commentId}`);
        console.log(
          `Before: likes=${comment.likes || 0}, dislikes=${
            comment.dislikes || 0
          }`
        );

        const updatedComment = { ...comment };

        // First undo any previous reaction
        if (currentReaction === "like") {
          updatedComment.likes = (updatedComment.likes || 0) - 1;
          console.log(
            `Removed previous like, new count: ${updatedComment.likes}`
          );
        } else if (currentReaction === "dislike") {
          updatedComment.dislikes = (updatedComment.dislikes || 0) - 1;
          console.log(
            `Removed previous dislike, new count: ${updatedComment.dislikes}`
          );
        }

        // Then apply new reaction if any
        if (newReaction === "like") {
          updatedComment.likes = (updatedComment.likes || 0) + 1;
          console.log(`Added new like, new count: ${updatedComment.likes}`);
        } else if (newReaction === "dislike") {
          updatedComment.dislikes = (updatedComment.dislikes || 0) + 1;
          console.log(
            `Added new dislike, new count: ${updatedComment.dislikes}`
          );
        }

        console.log(
          `After: likes=${updatedComment.likes}, dislikes=${updatedComment.dislikes}`
        );
        return updatedComment;
      }
      return comment;
    });

    // Save updated comments with reaction counts
    console.log("Setting updated comments:", updatedComments);
    setComments(updatedComments);

    // Make sure to save immediately to localStorage
    console.log("Saving updated reaction counts to localStorage...");
    saveCommentsStatsToLocalStorage(updatedComments);

    // Also save the liked comments separately for redundancy
    try {
      localStorage.setItem(
        `likes_${type}_${itemId}`,
        JSON.stringify(updatedLikedComments)
      );
      console.log(
        `Saved liked comments with key: likes_${type}_${itemId}`,
        updatedLikedComments
      );
    } catch (error) {
      console.error("Error saving liked comments to localStorage:", error);
    }
  };

  // Helper function to save comment stats to localStorage
  const saveCommentsStatsToLocalStorage = (commentsToSave: Comment[]) => {
    try {
      if (!commentsToSave || commentsToSave.length === 0) {
        console.log("No comments to save to localStorage");
        return;
      }

      // Extract just the stats we want to persist (id, likes, dislikes, replies)
      const commentsStats = commentsToSave
        .map((comment) => {
          // Make sure we have valid data
          if (!comment || typeof comment !== "object" || !comment.id) {
            console.error("Invalid comment object:", comment);
            return null;
          }

          return {
            id: comment.id,
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            replies: comment.replies || [],
          };
        })
        .filter(Boolean); // Remove any null entries

      if (commentsStats.length === 0) {
        console.error("No valid comment stats to save");
        return;
      }

      // Save with both the full key and an alternate key for redundancy
      const mainStorageKey = `${type}_${itemId}_comments_stats`;
      const backupStorageKey = `${itemId}_comments_stats`;

      const dataToSave = JSON.stringify(commentsStats);

      // Save to both keys for redundancy
      localStorage.setItem(mainStorageKey, dataToSave);
      localStorage.setItem(backupStorageKey, dataToSave);

      console.log(
        `SAVED comment stats to localStorage with keys: ${mainStorageKey} and ${backupStorageKey}`,
        commentsStats
      );

      // For debugging - immediately verify it was saved correctly
      const mainSavedData = localStorage.getItem(mainStorageKey);
      const backupSavedData = localStorage.getItem(backupStorageKey);

      // Check if verification succeeded
      const mainVerified = !!mainSavedData;
      const backupVerified = !!backupSavedData;

      console.log(
        `Verification - Retrieved ${
          mainVerified ? "SUCCESSFULLY" : "FAILED"
        } from main key, backup key ${backupVerified ? "SUCCEEDED" : "FAILED"}`
      );

      if (mainSavedData) {
        try {
          const parsed = JSON.parse(mainSavedData);
          console.log("Successfully parsed saved data:", parsed);
        } catch (e) {
          console.error("Could not parse saved data:", e);
        }
      }
    } catch (error) {
      console.error("Error saving comment stats to localStorage:", error);
    }
  };

  // Toggle showing replies for a comment
  const toggleReplies = (
    commentId: number,
    showReplies: Record<number, boolean>
  ) => {
    return {
      ...showReplies,
      [commentId]: !showReplies[commentId],
    };
  };

  // Handle sort change
  const handleSortChange = (sort: "newest" | "top") => {
    setActiveSort(sort);
    // Re-sort comments
    let sortedComments = [...comments];
    if (sort === "top") {
      sortedComments.sort(sortByTop);
    } else {
      sortedComments.sort(sortByNewest);
    }
    setComments(sortedComments);
  };

  // Helper function to get saved comment stats from localStorage
  const getSavedCommentStats = (commentId: number) => {
    try {
      // First try the main storage key
      const storageKey = `${type}_${itemId}_comments_stats`;
      const savedStatsString = localStorage.getItem(storageKey);

      console.log(`DEBUG - Checking localStorage:`, {
        key: storageKey,
        rawValue: savedStatsString,
        itemId: itemId,
        type: type,
        commentId: commentId,
        allLocalStorageKeys: Object.keys(localStorage)
          .filter((key) => key.includes("comments_stats"))
          .join(", "),
      });

      if (!savedStatsString) {
        // Also try without the type prefix as a fallback
        const alternateKey = `${itemId}_comments_stats`;
        const altSavedStatsString = localStorage.getItem(alternateKey);

        if (altSavedStatsString) {
          console.log(`Found stats with alternate key: ${alternateKey}`);
          const altSavedStats = JSON.parse(altSavedStatsString);
          const altCommentStats = altSavedStats.find(
            (stat: { id: number }) => stat.id === commentId
          );
          return altCommentStats || null;
        }

        console.log(`No stats found in localStorage for key: ${storageKey}`);
        return null;
      }

      let savedStats;
      try {
        savedStats = JSON.parse(savedStatsString);
        console.log(
          `Retrieved stats from localStorage for key: ${storageKey}`,
          savedStats
        );
      } catch (parseError) {
        console.error(
          `Error parsing localStorage data for ${storageKey}:`,
          parseError
        );
        console.log("Raw data from localStorage:", savedStatsString);
        return null;
      }

      // Try to find the comment by ID
      const commentStats = savedStats.find(
        (stat: { id: number }) => stat.id === commentId
      );

      console.log(
        commentStats
          ? `Found stats for comment ${commentId}: likes=${commentStats.likes}, dislikes=${commentStats.dislikes}`
          : `No stats found for comment ${commentId} in savedStats`
      );

      return commentStats || null;
    } catch (error) {
      console.error(
        `Error retrieving saved comment stats for comment ${commentId}:`,
        error
      );
      return null;
    }
  };

  if (loading && !comments.length) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - commentDate.getTime()) / 1000
    );

    // For comments less than 24 hours old, show relative time
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;

    // For older comments, show the full date and time
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return commentDate.toLocaleString("en-US", options);
  };

  // Render a single comment with its replies
  const renderComment = (comment: Comment, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? "ml-12 mt-3" : "mb-6"} flex`}
    >
      {/* Avatar/Icon */}
      <div className="flex-shrink-0 mr-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getAvatarColor(
            comment.user?.name || comment.guest_name || "Anonymous"
          )}`}
        >
          {(comment.user?.name || comment.guest_name || "A")[0].toUpperCase()}
        </div>
      </div>

      {/* Comment content */}
      <div className="flex-grow">
        <div className="flex items-center mb-1">
          <span className="font-semibold mr-2">
            {comment.user?.name || comment.guest_name || "Anonymous"}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimeAgo(comment.created_at)}
          </span>
        </div>

        <p className="text-gray-800 mb-2">{comment.content}</p>

        {/* Like/dislike buttons */}
        <div className="flex items-center space-x-4 mb-2">
          <motion.button
            onClick={() => handleReaction(comment.id, "like")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
              likedComments[comment.id] === "like"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform ${
                likedComments[comment.id] === "like"
                  ? "fill-current"
                  : "stroke-current"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
              />
            </svg>
            <span className="text-sm font-medium">{comment.likes || 0}</span>
          </motion.button>

          <motion.button
            onClick={() => handleReaction(comment.id, "dislike")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
              likedComments[comment.id] === "dislike"
                ? "text-red-600 bg-red-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform rotate-180 ${
                likedComments[comment.id] === "dislike"
                  ? "fill-current"
                  : "stroke-current"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
              />
            </svg>
            <span className="text-sm font-medium">{comment.dislikes || 0}</span>
          </motion.button>

          <motion.button
            onClick={() => handleReply(comment.id)}
            className="text-gray-600 hover:text-blue-600 hover:bg-gray-100 text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reply
          </motion.button>
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mb-4 mt-2">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-grow">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Add a reply..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  rows={2}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show replies if any */}
        {comment.replies && comment.replies.length > 0 && (
          <>
            <button
              onClick={() =>
                setShowReplies(toggleReplies(comment.id, showReplies))
              }
              className="text-blue-600 text-sm font-medium flex items-center mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              {showReplies[comment.id] ? "Hide" : "View"}{" "}
              {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </button>

            {showReplies[comment.id] && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">{totalComments} Comments</h3>

        {/* Add refresh button and sort dropdown in a flex container */}
        <div className="flex items-center space-x-4">
          {/* Manual Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={loading}
            className="text-gray-600 hover:text-blue-600 flex items-center"
            aria-label="Refresh comments"
          >
            <svg
              className={`w-5 h-5 mr-1 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-gray-700 hover:text-blue-600"
              onClick={() =>
                document
                  .getElementById("sort-dropdown")
                  ?.classList.toggle("hidden")
              }
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sort by
            </button>

            <div
              id="sort-dropdown"
              className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    sortBy === "top"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    handleSortChange("top");
                    document
                      .getElementById("sort-dropdown")
                      ?.classList.add("hidden");
                  }}
                >
                  Top comments
                </button>
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    sortBy === "newest"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    handleSortChange("newest");
                    document
                      .getElementById("sort-dropdown")
                      ?.classList.add("hidden");
                  }}
                >
                  Newest first
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment form */}
      <div className="mb-8 flex">
        <div className="flex-shrink-0 mr-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {isAuthenticated && user?.name ? (
              user.name[0].toUpperCase()
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-xl"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow">
          {!isAuthenticated && (
            <div className="mb-4">
              <label
                htmlFor="guest-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error && error.includes("name") ? "border-red-500" : ""
                  }`}
                  aria-required="true"
                />
                <div className="mt-1 h-5">
                  {/* This empty div will take up space but not show any text */}
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="comment-content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="comment-content"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              aria-required="true"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (!isAuthenticated && !guestName.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      </div>

      {/* Display all errors in one place */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments && comments.length > 0
          ? comments.map((comment) => renderComment(comment))
          : null}
      </div>

      {(!comments || comments.length === 0) && !loading && (
        <p className="text-center text-gray-600 py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default Comments;
