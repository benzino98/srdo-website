import api from "./api";
import { ApiResponse, PaginatedApiResponse } from "../types/api";
import { NewsArticle } from "../types/news";

export interface NewsFilters {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
}

const newsService = {
  /**
   * Get a paginated list of news articles
   */
  getNews: async (
    filters: NewsFilters = {}
  ): Promise<PaginatedApiResponse<NewsArticle>> => {
    try {
      return await api.get<PaginatedApiResponse<NewsArticle>>("/news", {
        params: filters,
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  },

  /**
   * Get a single news article by ID
   */
  getArticle: async (
    id: number | string
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      return await api.get<ApiResponse<NewsArticle>>(`/news/${id}`);
    } catch (error) {
      console.error(`Error fetching news article with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new news article
   */
  createArticle: async (
    formData: FormData
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      return await api.post<ApiResponse<NewsArticle>>("/news", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error creating news article:", error);
      throw error;
    }
  },

  /**
   * Create a new draft news article
   */
  createDraft: async (
    formData: FormData
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      return await api.post<ApiResponse<NewsArticle>>("/news/draft", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error creating draft news article:", error);
      throw error;
    }
  },

  /**
   * Update an existing news article
   */
  updateArticle: async (
    id: number | string,
    formData: FormData
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      return await api.put<ApiResponse<NewsArticle>>(`/news/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error(`Error updating news article with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing draft news article
   */
  updateDraft: async (
    id: number | string,
    formData: FormData
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      return await api.put<ApiResponse<NewsArticle>>(
        `/news/${id}/draft`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      console.error(`Error updating draft news article with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a news article
   */
  deleteArticle: async (id: number | string): Promise<ApiResponse<void>> => {
    try {
      return await api.delete<ApiResponse<void>>(`/news/${id}`);
    } catch (error) {
      console.error(`Error deleting news article with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get a news article by slug
   */
  getArticleBySlug: async (slug: string): Promise<ApiResponse<NewsArticle>> => {
    try {
      console.log(`Making API request to fetch article with slug: ${slug}`);
      const apiUrl =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
      console.log(`Full URL will be: ${apiUrl}/news/slug/${slug}`);

      const response = await api.get<ApiResponse<NewsArticle>>(
        `/news/slug/${slug}`
      );
      console.log("Article response:", response);

      // Transform the response to match expected NewsArticle type if needed
      if (response && response.data) {
        // Ensure all required fields are present
        const transformedData = {
          ...response.data,
          is_published:
            response.data.is_published !== undefined
              ? response.data.is_published
              : Boolean(response.data.published_at),
          created_at: response.data.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || new Date().toISOString(),
        };

        return {
          ...response,
          data: transformedData as NewsArticle,
        };
      }

      return response;
    } catch (error) {
      console.error(`Error fetching news article with slug ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing news article using JSON data instead of FormData
   * This can be more reliable for boolean fields
   */
  updateArticleJson: async (
    id: number | string,
    data: any
  ): Promise<ApiResponse<NewsArticle>> => {
    try {
      console.log("Updating article with JSON data:", { id, ...data });
      return await api.put<ApiResponse<NewsArticle>>(`/news/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
    } catch (error) {
      console.error(
        `Error updating news article with ID ${id} using JSON:`,
        error
      );
      throw error;
    }
  },
};

export default newsService;
