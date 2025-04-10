import api from "./api";
import { ApiResponse } from "../types/api";
import { AxiosResponse } from "axios";

export interface Resource {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  category: string;
  published: boolean;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceFilters {
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

const resourceService = {
  /**
   * Get a paginated list of resources
   */
  getResources: async (filters: ResourceFilters = {}) => {
    try {
      let url = `/resources?page=${filters.page || 1}`;

      if (filters.category) {
        url += `&category=${encodeURIComponent(filters.category)}`;
      }

      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }

      const response = await api.get<ApiResponse<Resource[]>>("/resources", {
        params: filters,
      });

      return response.data;
    } catch (error) {
      console.error(
        "resourceService.getResources: Error fetching resources:",
        error
      );
      throw error;
    }
  },

  /**
   * Download a resource and increment the download counter
   * @param id Resource ID
   * @returns Promise that resolves when download is initiated
   */
  downloadResource: async (id: number | string): Promise<void> => {
    try {
      // Get the resource metadata first to check if it exists
      const metadata = await api.get<Resource>(`/resources/${id}`);

      // Create a download token
      interface DownloadTokenResponse {
        token?: string;
        downloadUrl?: string;
        success: boolean;
      }

      // Try to generate a download token
      try {
        const tokenResponse = await api.post<DownloadTokenResponse>(
          `/resources/${id}/prepare-download`,
          {
            clientTimestamp: new Date().toISOString(),
          }
        );

        if (tokenResponse?.downloadUrl) {
          // Direct download URL provided by server
          window.open(tokenResponse.downloadUrl, "_blank");
          return;
        }

        // Fallback 1: Use token-based download
        if (tokenResponse?.token) {
          const apiInstance = api.getInstance();
          const baseURL = apiInstance.defaults.baseURL || "";
          const downloadUrl = `${baseURL}/resources/${id}/download-file?token=${tokenResponse.token}`;
          window.open(downloadUrl, "_blank");
          return;
        }
      } catch (tokenError) {
        console.warn(
          "Could not create download token, falling back to direct download",
          tokenError
        );
      }

      // Fallback 2: Try direct download as last resort
      const apiInstance = api.getInstance();
      const baseURL = apiInstance.defaults.baseURL || "";
      const downloadUrl = `${baseURL}/resources/${id}/download`;

      // Create a hidden iframe for download to avoid blocking
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);

      // Remove iframe after download starts
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    } catch (error) {
      console.error(`Error downloading resource with ID ${id}:`, error);
      throw error;
    }
  },
};

export default resourceService;
