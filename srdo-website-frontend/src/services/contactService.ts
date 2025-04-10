import api from "./api";
import { ApiResponse, PaginatedApiResponse } from "../types/api";

export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface Contact extends ContactFormData {
  id: number;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFilters {
  status?: "read" | "unread" | "all";
  page?: number;
  per_page?: number;
}

const contactService = {
  /**
   * Submit a contact form
   */
  submitContactForm: async (data: ContactFormData): Promise<Contact> => {
    try {
      const response = await api.post<ApiResponse<Contact>>("/contact", data);
      return response.data;
    } catch (error) {
      console.error("Error submitting contact form:", error);
      throw error;
    }
  },

  /**
   * Get a paginated list of contact submissions (admin only)
   */
  getContacts: async (
    filters: ContactFilters = {}
  ): Promise<PaginatedApiResponse<Contact[]>> => {
    try {
      const response = await api.get<PaginatedApiResponse<Contact[]>>(
        "/contacts",
        { params: filters }
      );
      return response;
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      throw error;
    }
  },

  /**
   * Mark a contact submission as read (admin only)
   */
  markAsRead: async (id: number | string): Promise<Contact> => {
    try {
      const response = await api.patch<ApiResponse<Contact>>(
        `/contacts/${id}/read`
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking contact with ID ${id} as read:`, error);
      throw error;
    }
  },
};

export default contactService;
