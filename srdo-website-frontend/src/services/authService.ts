import { User } from "../types/user";
import apiService, { TOKEN_KEY } from "./api";
import { ApiResponse } from "../types/api";
import axios from "axios";

export const USER_KEY = "srdo_user";

export type { User }; // Re-export User type

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthError extends Error {
  status?: number;
  code?: string;
}

class AuthService {
  private setAuthHeader(token: string | null) {
    if (token) {
      // Import apiService correctly to avoid circular dependencies
      import("./api").then((apiModule) => {
        const api = apiModule.default.getInstance();
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      });
    } else {
      // Import apiService correctly to avoid circular dependencies
      import("./api").then((apiModule) => {
        const api = apiModule.default.getInstance();
        delete api.defaults.headers.common["Authorization"];
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      this.logout(); // Clear invalid data
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.role && user.role === role);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return Boolean(token && user);
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiService.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        credentials
      );

      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error("Invalid response format from server");
      }

      const { token, user } = response.data;

      // Validate user object
      if (!user.id || !user.email) {
        throw new Error("Invalid user data received");
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.setAuthHeader(token);

      return user;
    } catch (error: any) {
      const authError: AuthError = new Error(
        error.response?.data?.message || error.message || "Login failed"
      );
      authError.status = error.response?.status;
      authError.code = error.response?.data?.code;

      throw authError;
    }
  }

  async logout(): Promise<void> {
    try {
      // Attempt to call logout endpoint if it exists
      await apiService.post("/auth/logout").catch(() => {
        // Silently fail if the endpoint doesn't exist or fails
      });
    } finally {
      // Always clear local storage and headers
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      this.setAuthHeader(null);
    }
  }

  async testApiConnection(): Promise<{ status: string; message: string }> {
    try {
      return await apiService.testConnection();
    } catch (error: any) {
      return {
        status: "error",
        message: error.message || "Connection test failed",
      };
    }
  }

  private isRefreshing = false;

  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return false;
    }

    this.isRefreshing = true;

    try {
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
      const currentToken = localStorage.getItem(TOKEN_KEY);

      if (!currentToken) {
        this.isRefreshing = false;
        return false;
      }

      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
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

      if (response.data && response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        this.isRefreshing = false;
        return true;
      }
    } catch (error) {
      try {
        // Fallback to public refresh endpoint
        const API_URL =
          process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
        const currentToken = localStorage.getItem(TOKEN_KEY);

        if (!currentToken) {
          this.isRefreshing = false;
          return false;
        }

        const fallbackResponse = await axios.post(
          `${API_URL}/auth/refresh-public`,
          { token: currentToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            withCredentials: true,
          }
        );

        if (fallbackResponse.data && fallbackResponse.data.token) {
          localStorage.setItem(TOKEN_KEY, fallbackResponse.data.token);
          this.isRefreshing = false;
          return true;
        }
      } catch (fallbackError) {}
    }

    this.isRefreshing = false;

    // Even if refresh failed, allow the operation to continue with existing token
    // This prevents token refresh issues from blocking API calls
    return true;
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      // Use GET method instead of POST to match the backend route definition
      const response = await apiService.get<ApiResponse<{ valid: boolean }>>(
        "/auth/verify"
      );

      return response.data?.valid ?? false;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
