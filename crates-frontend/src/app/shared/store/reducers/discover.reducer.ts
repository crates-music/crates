import { createReducer, on } from '@ngrx/store';
import { User } from '../../../user/shared/model/user.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Page } from '../../model/page.model';
import * as DiscoverActions from '../actions/discover.actions';

export interface DiscoverState {
  // Public crates discovery
  publicCrates: Page<Crate> | null;
  publicCratesLoading: boolean;

  // User profile discovery
  userProfile: User | null;
  userProfileLoading: boolean;

  // User's public crates
  userPublicCrates: Page<Crate> | null;
  userPublicCratesLoading: boolean;

  // Error states
  error: any;
}

export const initialState: DiscoverState = {
  publicCrates: null,
  publicCratesLoading: false,
  userProfile: null,
  userProfileLoading: false,
  userPublicCrates: null,
  userPublicCratesLoading: false,
  error: null
};

export const discoverReducer = createReducer(
  initialState,

  // Discover Crates
  on(DiscoverActions.discoverCrates, (state) => ({
    ...state,
    publicCratesLoading: true,
    error: null
  })),

  on(DiscoverActions.discoverCratesResult, (state, { response }) => ({
    ...state,
    publicCratesLoading: false,
    publicCrates: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),

  // Get User Profile
  on(DiscoverActions.getUserProfile, (state) => ({
    ...state,
    userProfileLoading: true,
    error: null
  })),

  on(DiscoverActions.getUserProfileResult, (state, { response }) => ({
    ...state,
    userProfileLoading: false,
    userProfile: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),

  // Get User Public Crates
  on(DiscoverActions.getUserPublicCrates, (state) => ({
    ...state,
    userPublicCratesLoading: true,
    error: null
  })),

  on(DiscoverActions.getUserPublicCratesResult, (state, { response }) => ({
    ...state,
    userPublicCratesLoading: false,
    userPublicCrates: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),

  // Clear Actions
  on(DiscoverActions.clearDiscoverResults, (state) => ({
    ...state,
    publicCrates: null,
    userProfile: null,
    userPublicCrates: null
  })),

  on(DiscoverActions.clearDiscoverErrors, (state) => ({
    ...state,
    error: null
  }))
);

// Selector functions
export const isPublicCrates = (state: DiscoverState) => state.publicCrates;
export const isPublicCratesLoading = (state: DiscoverState) => state.publicCratesLoading;
export const getUserProfile = (state: DiscoverState) => state.userProfile;
export const getUserProfileLoading = (state: DiscoverState) => state.userProfileLoading;
export const getUserPublicCrates = (state: DiscoverState) => state.userPublicCrates;
export const getUserPublicCratesLoading = (state: DiscoverState) => state.userPublicCratesLoading;
export const getDiscoverError = (state: DiscoverState) => state.error;
