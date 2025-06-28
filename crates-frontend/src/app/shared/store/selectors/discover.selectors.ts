import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DiscoverState } from '../reducers/discover.reducer';
import * as fromDiscover from '../reducers/discover.reducer';

export const selectDiscoverState = createFeatureSelector<DiscoverState>('discover');

// Public Crates Discovery Selectors
export const selectPublicCrates = createSelector(
  selectDiscoverState,
  fromDiscover.isPublicCrates
);

export const selectPublicCratesLoading = createSelector(
  selectDiscoverState,
  fromDiscover.isPublicCratesLoading
);

// User Profile Discovery Selectors
export const selectUserProfile = createSelector(
  selectDiscoverState,
  fromDiscover.getUserProfile
);

export const selectUserProfileLoading = createSelector(
  selectDiscoverState,
  fromDiscover.getUserProfileLoading
);

// User Public Crates Selectors
export const selectUserPublicCrates = createSelector(
  selectDiscoverState,
  fromDiscover.getUserPublicCrates
);

export const selectUserPublicCratesLoading = createSelector(
  selectDiscoverState,
  fromDiscover.getUserPublicCratesLoading
);

// Error Selectors
export const selectDiscoverError = createSelector(
  selectDiscoverState,
  fromDiscover.getDiscoverError
);
