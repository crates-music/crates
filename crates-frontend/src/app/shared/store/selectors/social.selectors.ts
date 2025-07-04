import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SocialState } from '../reducers/social.reducer';
import * as fromSocial from '../reducers/social.reducer';

export const selectSocialState = createFeatureSelector<SocialState>('social');

// Follow Status Selectors
export const selectFollowStatus = createSelector(
  selectSocialState,
  fromSocial.getFollowStatus
);

export const selectFollowLoading = createSelector(
  selectSocialState,
  fromSocial.getFollowLoading
);

export const selectUserFollowStatus = (userId: number) => createSelector(
  selectFollowStatus,
  (followStatus) => followStatus[userId] || { isFollowing: false }
);

export const selectUserFollowLoading = (userId: number) => createSelector(
  selectFollowLoading,
  (followLoading) => followLoading[userId] || false
);

// Social Stats Selectors
export const selectSocialStats = createSelector(
  selectSocialState,
  fromSocial.getSocialStats
);

export const selectStatsLoading = createSelector(
  selectSocialState,
  fromSocial.getStatsLoading
);

// User Social Stats Selectors
export const selectUserSocialStats = createSelector(
  selectSocialState,
  fromSocial.getUserSocialStats
);

export const selectUserStatsLoading = createSelector(
  selectSocialState,
  fromSocial.getUserStatsLoading
);

export const selectUserSocialStatsById = (userId: number) => createSelector(
  selectUserSocialStats,
  (userStats) => userStats[userId] || null
);

export const selectUserStatsLoadingById = (userId: number) => createSelector(
  selectUserStatsLoading,
  (userStatsLoading) => userStatsLoading[userId] || false
);

// User Search Selectors
export const selectSearchResults = createSelector(
  selectSocialState,
  fromSocial.getSearchResults
);

export const selectSearchLoading = createSelector(
  selectSocialState,
  fromSocial.getSearchLoading
);

// Following/Followers Selectors
export const selectFollowing = createSelector(
  selectSocialState,
  fromSocial.getFollowing
);

export const selectFollowingLoading = createSelector(
  selectSocialState,
  fromSocial.getFollowingLoading
);

export const selectFollowers = createSelector(
  selectSocialState,
  fromSocial.getFollowers
);

export const selectFollowersLoading = createSelector(
  selectSocialState,
  fromSocial.getFollowersLoading
);

// Error Selectors
export const selectSocialError = createSelector(
  selectSocialState,
  fromSocial.getSocialError
);