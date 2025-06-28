import { createReducer, on } from '@ngrx/store';
import { UserFollow } from '../../model/user-follow.model';
import { SocialStats, FollowStatus } from '../../model/social-stats.model';
import { User } from '../../../user/shared/model/user.model';
import { Page } from '../../model/page.model';
import * as SocialActions from '../actions/social.actions';

export interface SocialState {
  // Follow status for different users
  followStatus: { [userId: number]: FollowStatus };
  followLoading: { [userId: number]: boolean };
  
  // Social stats
  socialStats: SocialStats | null;
  statsLoading: boolean;
  
  // User search results
  searchResults: Page<User> | null;
  searchLoading: boolean;
  
  // Following/Followers lists
  following: Page<UserFollow> | null;
  followingLoading: boolean;
  
  followers: Page<UserFollow> | null;
  followersLoading: boolean;
  
  // Error states
  error: any;
}

export const initialState: SocialState = {
  followStatus: {},
  followLoading: {},
  socialStats: null,
  statsLoading: false,
  searchResults: null,
  searchLoading: false,
  following: null,
  followingLoading: false,
  followers: null,
  followersLoading: false,
  error: null
};

export const socialReducer = createReducer(
  initialState,
  
  // Follow User
  on(SocialActions.followUser, (state, { userId }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: true },
    error: null
  })),
  
  on(SocialActions.followUserResult, (state, { userId, response }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: false },
    followStatus: response.success ? { 
      ...state.followStatus, 
      [userId]: { isFollowing: true }
    } : state.followStatus,
    error: response.success ? null : response.error
  })),
  
  // Unfollow User
  on(SocialActions.unfollowUser, (state, { userId }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: true },
    error: null
  })),
  
  on(SocialActions.unfollowUserResult, (state, { userId, response }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: false },
    followStatus: response.success ? { 
      ...state.followStatus, 
      [userId]: { isFollowing: false }
    } : state.followStatus,
    error: response.success ? null : response.error
  })),
  
  // Load Follow Status
  on(SocialActions.loadFollowStatus, (state, { userId }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: true }
  })),
  
  on(SocialActions.loadFollowStatusResult, (state, { userId, response }) => ({
    ...state,
    followLoading: { ...state.followLoading, [userId]: false },
    followStatus: response.success ? { 
      ...state.followStatus, 
      [userId]: response.data! 
    } : state.followStatus,
    error: response.success ? null : response.error
  })),
  
  // Social Stats
  on(SocialActions.loadSocialStats, (state) => ({
    ...state,
    statsLoading: true,
    error: null
  })),
  
  on(SocialActions.loadSocialStatsResult, (state, { response }) => ({
    ...state,
    statsLoading: false,
    socialStats: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),
  
  // Search Users
  on(SocialActions.searchUsers, (state) => ({
    ...state,
    searchLoading: true,
    error: null
  })),
  
  on(SocialActions.searchUsersResult, (state, { response }) => ({
    ...state,
    searchLoading: false,
    searchResults: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),
  
  // Following List
  on(SocialActions.loadFollowing, (state) => ({
    ...state,
    followingLoading: true,
    error: null
  })),
  
  on(SocialActions.loadFollowingResult, (state, { response }) => ({
    ...state,
    followingLoading: false,
    following: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),
  
  // Followers List
  on(SocialActions.loadFollowers, (state) => ({
    ...state,
    followersLoading: true,
    error: null
  })),
  
  on(SocialActions.loadFollowersResult, (state, { response }) => ({
    ...state,
    followersLoading: false,
    followers: response.success ? response.data! : null,
    error: response.success ? null : response.error
  })),
  
  // Clear Actions
  on(SocialActions.clearSearchResults, (state) => ({
    ...state,
    searchResults: null
  })),
  
  on(SocialActions.clearSocialErrors, (state) => ({
    ...state,
    error: null
  }))
);

// Selector functions
export const getFollowStatus = (state: SocialState) => state.followStatus;
export const getFollowLoading = (state: SocialState) => state.followLoading;
export const getSocialStats = (state: SocialState) => state.socialStats;
export const getStatsLoading = (state: SocialState) => state.statsLoading;
export const getSearchResults = (state: SocialState) => state.searchResults;
export const getSearchLoading = (state: SocialState) => state.searchLoading;
export const getFollowing = (state: SocialState) => state.following;
export const getFollowingLoading = (state: SocialState) => state.followingLoading;
export const getFollowers = (state: SocialState) => state.followers;
export const getFollowersLoading = (state: SocialState) => state.followersLoading;
export const getSocialError = (state: SocialState) => state.error;