import { ApiError } from './api-error.model';

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: ApiError;
}
