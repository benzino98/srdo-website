import { useState, useCallback } from "react";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import apiService from "../services/api";
import { ApiResponse, ApiError } from "../types/api";

// API URL with v1 prefix included
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (
      method: string,
      endpoint: string,
      body?: unknown,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
      // Add debug log for project endpoints
      if (endpoint.includes("/projects/")) {
        console.log(
          `[useApi Debug] Making request to project endpoint: ${endpoint}`
        );
        console.log(`[useApi Debug] Full URL will be: ${API_URL}${endpoint}`);
      }

      setLoading(true);
      setError(null);

      try {
        let response: AxiosResponse;

        switch (method.toUpperCase()) {
          case "GET":
            response = await apiService.get(endpoint, config);
            break;
          case "POST":
            response = await apiService.post(endpoint, body, config);
            break;
          case "PUT":
            response = await apiService.put(endpoint, body, config);
            break;
          case "DELETE":
            response = await apiService.delete(endpoint, config);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        // Additional debugging for projects endpoint

        // Handle the API response properly for different formats
        let apiResponse: ApiResponse<T>;

        if (Array.isArray(response.data)) {
          // If response is a direct array (some endpoints may return it this way)
          apiResponse = { data: response.data as T };
        } else if (
          typeof response.data === "object" &&
          response.data !== null
        ) {
          // If it's an object (likely with data property)
          apiResponse = response.data as ApiResponse<T>;

          // Ensure we have a data property accessible
          if (!apiResponse.data && response.data.data) {
            // If the data is in response.data.data, restructure it
            apiResponse.data = response.data.data as T;
          }
        } else {
          // Fallback for any other format
          apiResponse = { data: response.data as T };
        }

        // Special handling for resources and projects endpoints
        if (endpoint.includes("/resources") || endpoint.includes("/projects")) {
          // Make sure we actually have some data to return
          if (!apiResponse.data && response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
              // If data is nested in a data property
              setData(response.data.data as T);
            } else if (Array.isArray(response.data)) {
              // If response.data is directly an array
              setData(response.data as T);
            } else {
              // Last attempt to find usable data
              const possibleArrays = Object.values(response.data).filter(
                (value) => Array.isArray(value) && value.length > 0
              );

              if (possibleArrays.length > 0) {
                setData(possibleArrays[0] as T);
              } else {
                setData(null);
              }
            }
          } else {
            setData(apiResponse.data);
          }
        } else {
          // For non-resource/projects endpoints
          setData(apiResponse.data);
        }

        setLoading(false);
        return apiResponse;
      } catch (err) {
        console.error(`Error calling ${endpoint}`);

        const error = err as AxiosError<{ message: string }>;
        let errorMessage = "Failed to load data";
        let statusCode = 0;

        if (error.response) {
          statusCode = error.response.status;
          errorMessage =
            error.response.data?.message ||
            `Server error: ${error.response.status}`;

          if (statusCode === 401) {
            errorMessage = "Your session has expired. Please login again.";
          }
        } else if (error.request) {
          errorMessage =
            "No response from server. Please check your network connection.";
        } else {
          errorMessage = error.message || "Unknown error occurred";
        }

        const apiError: ApiError = {
          message: errorMessage,
          status: statusCode,
        };

        setError(apiError);
        setLoading(false);
        throw apiError;
      }
    },
    []
  );

  const get = useCallback(
    (endpoint: string, config?: AxiosRequestConfig) =>
      execute("GET", endpoint, undefined, config),
    [execute]
  );

  const post = useCallback(
    (endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
      execute("POST", endpoint, data, config),
    [execute]
  );

  const put = useCallback(
    (endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
      execute("PUT", endpoint, data, config),
    [execute]
  );

  const del = useCallback(
    (endpoint: string, config?: AxiosRequestConfig) =>
      execute("DELETE", endpoint, undefined, config),
    [execute]
  );

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
    get,
    post,
    put,
    del,
  };
}
