import api from "./api";
import { ApiResponse, PaginatedApiResponse } from "../types/api";

export interface Partner {
  id: number;
  name: string;
  logo_url: string;
  website_url: string;
  description: string;
}

export interface Impact {
  id: number;
  title: string;
  description: string;
  value: string;
  icon: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  status: "ongoing" | "completed";
  image_url: string;
  start_date: string;
  end_date: string | null;
  location: string;
  budget: string | null;
  partners?: Partner[];
  impacts?: Impact[];
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  status?: "ongoing" | "completed" | "all";
  page?: number;
  per_page?: number;
}

const projectService = {
  /**
   * Create a new project
   */
  createProject: async (projectData: Partial<Project>) => {
    try {
      const response = await api.post<ApiResponse<Project>>(
        "/projects",
        projectData
      );
      return response.data;
    } catch (error: any) {
      console.error("Project creation failed:", {
        error: error,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      });
      throw error;
    }
  },

  /**
   * Get a list of projects
   */
  getProjects: async () => {
    try {
      const response = await api.get<ApiResponse<Project[]>>("/projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  /**
   * Get a paginated list of projects
   */
  getProjectsPaginated: async (
    filters: ProjectFilters = {}
  ): Promise<PaginatedApiResponse<Project[]>> => {
    try {
      const response = await api.get<PaginatedApiResponse<Project[]>>(
        "/projects",
        { params: filters }
      );
      return response;
    } catch (error) {
      console.error("Error fetching paginated projects:", error);
      throw error;
    }
  },

  /**
   * Get a single project by ID
   */
  getProject: async (id: number | string): Promise<Project> => {
    try {
      const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a project by ID
   */
  deleteProject: async (id: number | string) => {
    try {
      const response = await api.delete<any>(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a project using FormData (for file uploads)
   */
  updateProject: async (id: number | string, formData: FormData) => {
    try {
      const response = await api.post<ApiResponse<Project>>(
        `/projects/${id}?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating project with ID ${id} using FormData:`,
        error
      );
      throw error;
    }
  },

  /**
   * Update a project using JSON data (more reliable for non-file fields)
   */
  updateProjectJson: async (id: number | string, data: any) => {
    try {
      const response = await api.put<ApiResponse<Project>>(
        `/projects/${id}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating project with ID ${id} using JSON:`, error);
      throw error;
    }
  },
};

export default projectService;
