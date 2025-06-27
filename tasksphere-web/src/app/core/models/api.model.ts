export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ApiError {
  error: string;
  details?: ValidationError[];
  status?: number;
}
