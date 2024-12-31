import { ApiError } from './api-error.model';

export interface Loadable<T> {
  value?: T;
  loading: boolean;
  loaded: boolean;
  hasNextPage?: boolean;
  error?: ApiError;
}

export function emptyLoadable<T>(): Loadable<T> {
  return {
    loading: false,
    loaded: false,
    hasNextPage: false,
  }
}
