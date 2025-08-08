import { Action, createReducer, on } from '@ngrx/store';
import { checkAuthStatus, loginSuccess, logout, authError } from '../actions/auth.actions';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null
};

const authReducer = createReducer(
  initialState,
  on(checkAuthStatus, (state): AuthState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loginSuccess, (state, action): AuthState => ({
    ...state,
    isAuthenticated: true,
    token: action.token,
    loading: false,
    error: null
  })),
  on(logout, (state): AuthState => ({
    ...state,
    isAuthenticated: false,
    token: null,
    loading: false,
    error: null
  })),
  on(authError, (state, action): AuthState => ({
    ...state,
    loading: false,
    error: action.error
  }))
);

export function reducer(state: AuthState | undefined, action: Action) {
  return authReducer(state, action);
}

export const getIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const getToken = (state: AuthState) => state.token;
export const getLoading = (state: AuthState) => state.loading;
export const getError = (state: AuthState) => state.error;