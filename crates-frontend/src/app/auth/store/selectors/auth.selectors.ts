import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAuth from '../reducers/auth.reducer';

export const selectAuthState = createFeatureSelector<fromAuth.AuthState>('auth');

export const selectIsAuthenticated = createSelector(selectAuthState, fromAuth.getIsAuthenticated);
export const selectAuthToken = createSelector(selectAuthState, fromAuth.getToken);
export const selectAuthLoading = createSelector(selectAuthState, fromAuth.getLoading);
export const selectAuthError = createSelector(selectAuthState, fromAuth.getError);