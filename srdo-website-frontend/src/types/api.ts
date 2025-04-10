export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
