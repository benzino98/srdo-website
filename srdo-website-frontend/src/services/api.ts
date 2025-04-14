import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from "axios";
import { ApiResponse } from "../types/api";

// Token key constant
export const TOKEN_KEY = "srdo_token";

// Ensure API_URL correctly includes /v1 to prevent path duplication in requests
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

// Create a cache to track failed endpoints and prevent continuous retries
const failedEndpointsCache = new Map<
  string,
  { timestamp: number; count: number }
>();
const MAX_RETRY_ATTEMPTS = 1;
const RETRY_TIMEOUT_MS = 60000; // 1 minute

// Helper function to check if an endpoint has failed too many times
const shouldSkipRequest = (url: string, method: string = "get"): boolean => {
  const endpointKey = `${method}-${url}`;
  const failedEndpoint = failedEndpointsCache.get(endpointKey);

  if (failedEndpoint) {
    const currentTime = Date.now();
    // If we have failed too many times and we're still within the timeout period
    if (
      failedEndpoint.count >= MAX_RETRY_ATTEMPTS &&
      currentTime - failedEndpoint.timestamp < RETRY_TIMEOUT_MS
    ) {
      return true;
    } else if (currentTime - failedEndpoint.timestamp >= RETRY_TIMEOUT_MS) {
      // If timeout has passed, reset the count
      failedEndpointsCache.delete(endpointKey);
    }
  }
  return false;
};

// Helper function to track failed endpoint requests
const trackFailedEndpoint = (
  url: string,
  method: string = "get",
  status: number = 404
): void => {
  // Only track 404 and network errors (0)
  if (status !== 404 && status !== 0) return;

  const endpointKey = `${method}-${url}`;
  const failedEndpoint = failedEndpointsCache.get(endpointKey) || {
    timestamp: Date.now(),
    count: 0,
  };
  failedEndpoint.count += 1;
  failedEndpoint.timestamp = Date.now();

  failedEndpointsCache.set(endpointKey, failedEndpoint);
};

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 30000,
  withCredentials: true, // Important: Send cookies for CORS
});

// Add a flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers about a new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// When refresh fails, reject all subscribers
const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach((callback) => callback(""));
  refreshSubscribers = [];
};

// Function to get CSRF token
const getCsrfToken = async () => {
  try {
    // Strip both /api and /v1 from the URL to get the base URL
    const baseUrl = API_URL.replace(/\/api\/v1$/, "").replace(/\/api$/, "");
    await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } catch (error) {
    throw error;
  }
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    // Check if this endpoint has failed too many times recently
    if (config.url && shouldSkipRequest(config.url, config.method)) {
      // Return a rejected promise to prevent the request
      return Promise.reject(
        new Error(`Request to ${config.url} cancelled due to previous failures`)
      );
    }

    // For mutation operations (POST, PUT, DELETE), get CSRF token first
    if (
      ["post", "put", "delete"].includes(config.method?.toLowerCase() || "")
    ) {
      await getCsrfToken();
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Ensure Authorization header is properly set with Bearer token
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }

    // Don't set Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle binary data properly
api.interceptors.response.use(
  (response) => {
    // Don't attempt to parse binary responses
    const contentType = response.headers["content-type"];
    if (
      contentType &&
      (contentType.includes("application/octet-stream") ||
        contentType.includes("application/pdf") ||
        contentType.includes("application/zip") ||
        contentType.includes("application/msword") ||
        contentType.includes("application/vnd.openxmlformats") ||
        response.config.responseType === "blob")
    ) {
      return response;
    }

    return response;
  },
  async (error) => {
    // For download errors, provide more specific information
    if (error.config?.responseType === "blob") {
      console.error("Download error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (!error.response) {
      // Track network errors
      if (error.config && error.config.url) {
        trackFailedEndpoint(error.config.url, error.config.method, 0);
      }

      return Promise.reject({
        message: "Network error. Please check your connection and try again.",
        isNetworkError: true,
      });
    }

    // Track 404 errors to prevent continuous retries
    if (error.response.status === 404 && error.config && error.config.url) {
      trackFailedEndpoint(
        error.config.url,
        error.config.method,
        error.response.status
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      // Get the original request config
      const originalRequest = error.config;

      // Check if this is a request to a public endpoint (allow to continue without refreshing)
      const publicEndpoints = ["/resources", "/news", "/projects"];
      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        originalRequest.url?.includes(endpoint)
      );

      // For public endpoints, we'll allow the request to continue even with 401 error
      // This helps with displaying resources even when authentication fails
      if (isPublicEndpoint && !originalRequest.url?.includes("/admin")) {
        // For read-only endpoints, allow continuing without authentication
        if (originalRequest.method?.toLowerCase() === "get") {
          // Just return a modified response that won't trigger further auth issues
          return Promise.resolve({
            status: 200,
            statusText: "OK",
            headers: {},
            config: originalRequest,
            data: error.response.data || { data: [] },
          });
        }
      }

      // Try to refresh the token if this is not already a refresh token request
      const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

      if (!isRefreshRequest && !originalRequest._retry) {
        // Mark this request as retried to prevent infinite loop
        originalRequest._retry = true;

        // If we're not already refreshing a token
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            // Import and use the authService here to avoid circular dependencies
            const authService = await import("./authService").then(
              (module) => module.default
            );

            // Use a direct axios call to the public refresh endpoint
            const currentToken = localStorage.getItem(TOKEN_KEY);

            try {
              // Try with our custom public endpoint first
              const refreshResponse = await axios.post(
                `${API_URL}/auth/refresh-public`,
                { token: currentToken },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Authorization: `Bearer ${currentToken}`,
                  },
                  withCredentials: true,
                }
              );

              if (refreshResponse.data?.token) {
                // Store the new token
                localStorage.setItem(TOKEN_KEY, refreshResponse.data.token);

                // Notify all subscribers
                onTokenRefreshed(refreshResponse.data.token);

                // Update the original request config with the new token
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;

                // Reset refreshing flag
                isRefreshing = false;

                // Retry the original request with the new token
                return api(originalRequest);
              }
            } catch (publicRefreshError) {
              // Fall back to the regular refresh method
              const refreshSuccess = await authService.refreshToken();

              if (refreshSuccess) {
                // Get the new token
                const newToken = localStorage.getItem(TOKEN_KEY);

                if (newToken) {
                  // Notify all subscribers
                  onTokenRefreshed(newToken);

                  // Update the original request config with the new token
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;

                  // Reset refreshing flag
                  isRefreshing = false;

                  // Retry the original request with the new token
                  return api(originalRequest);
                }
              }
            }

            // If we get here, both refresh methods failed

            isRefreshing = false;
            onRefreshFailed(error);

            // If we're in the browser, attempt to redirect to login
            if (typeof window !== "undefined") {
              const currentPath = window.location.pathname;
              // Store current path for redirect after login
              sessionStorage.setItem("redirect_after_login", currentPath);
              // Check if we're not already on the login page to avoid refresh loops
              if (!currentPath.includes("/login")) {
                window.location.href = "/admin/login";
              }
            }

            return Promise.reject(error);
          } catch (refreshError) {
            isRefreshing = false;
            onRefreshFailed(refreshError);
            return Promise.reject(error);
          }
        } else {
          // If we are already refreshing, wait for the new token
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleApiResponse = async <T>(promise: Promise<any>): Promise<T> => {
  try {
    const response = await promise;
    // Return the entire response data as it's already typed correctly
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Custom project API wrapper
export const projectApi = {
  // Enhanced get method for project details
  getProjectDetail: async (
    projectId: string | number,
    config?: AxiosRequestConfig
  ) => {
    // Try with v1 prefix first
    try {
      const response = await api.get(`/v1/projects/${projectId}`, config);
      return response;
    } catch (err) {
      // Try without v1 prefix as fallback
      try {
        const response = await api.get(`/projects/${projectId}`, config);
        return response;
      } catch (secondErr) {
        throw secondErr; // Re-throw the error
      }
    }
  },
};

// API methods with proper typing
const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    handleApiResponse<T>(api.get<T>(url, config)),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    handleApiResponse<T>(api.post<T>(url, data, config)),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    handleApiResponse<T>(api.put<T>(url, data, config)),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    handleApiResponse<T>(api.patch<T>(url, data, config)),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    handleApiResponse<T>(api.delete<T>(url, config)),

  // Test API connectivity
  testConnection: async () => {
    try {
      const response = await api.get("/ping");
      return {
        status: "success",
        message: `API connection successful: ${JSON.stringify(response.data)}`,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `API connection test failed: ${error.message}`,
      };
    }
  },

  // Get the current instance
  getInstance: () => api,
};

export default apiService;
