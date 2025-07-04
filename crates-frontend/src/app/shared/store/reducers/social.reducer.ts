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
  
  // User social stats by user ID (for optimistic updates)
  userSocialStats: { [userId: number]: SocialStats };
  userStatsLoading: { [userId: number]: boolean };
  
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
  userSocialStats: {},
  userStatsLoading: {},
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
  on(SocialActions.followUser, (state, { userId }) => {
    // Optimistic update: increment follower count for the target user
    const currentStats = state.userSocialStats[userId];
    const updatedStats = currentStats ? {
      ...currentStats,
      followerCount: (currentStats.followerCount || 0) + 1
    } : null;
    
    return {
      ...state,
      followLoading: { ...state.followLoading, [userId]: true },
      userSocialStats: updatedStats ? {
        ...state.userSocialStats,
        [userId]: updatedStats
      } : state.userSocialStats,
      error: null
    };
  }),
  
  on(SocialActions.followUserResult, (state, { userId, response }) => {
    // If API call failed, revert optimistic update
    if (!response.success) {
      const currentStats = state.userSocialStats[userId];
      const revertedStats = currentStats ? {
        ...currentStats,
        followerCount: Math.max(0, (currentStats.followerCount || 0) - 1)
      } : null;
      
      return {
        ...state,
        followLoading: { ...state.followLoading, [userId]: false },
        userSocialStats: revertedStats ? {
          ...state.userSocialStats,
          [userId]: revertedStats
        } : state.userSocialStats,
        error: response.error
      };
    }
    
    return {
      ...state,
      followLoading: { ...state.followLoading, [userId]: false },
      followStatus: { 
        ...state.followStatus, 
        [userId]: { isFollowing: true }
      },
      error: null
    };
  }),
  
  // Unfollow User
  on(SocialActions.unfollowUser, (state, { userId }) => {
    // Optimistic update: decrement follower count for the target user
    const currentStats = state.userSocialStats[userId];
    const updatedStats = currentStats ? {
      ...currentStats,
      followerCount: Math.max(0, (currentStats.followerCount || 0) - 1)
    } : null;
    
    return {
      ...state,
      followLoading: { ...state.followLoading, [userId]: true },
      userSocialStats: updatedStats ? {
        ...state.userSocialStats,
        [userId]: updatedStats
      } : state.userSocialStats,
      error: null
    };
  }),
  
  on(SocialActions.unfollowUserResult, (state, { userId, response }) => {
    // If API call failed, revert optimistic update
    if (!response.success) {
      const currentStats = state.userSocialStats[userId];
      const revertedStats = currentStats ? {
        ...currentStats,
        followerCount: (currentStats.followerCount || 0) + 1
      } : null;
      
      return {
        ...state,
        followLoading: { ...state.followLoading, [userId]: false },
        userSocialStats: revertedStats ? {
          ...state.userSocialStats,
          [userId]: revertedStats
        } : state.userSocialStats,
        error: response.error
      };
    }
    
    return {
      ...state,
      followLoading: { ...state.followLoading, [userId]: false },
      followStatus: { 
        ...state.followStatus, 
        [userId]: { isFollowing: false }
      },
      error: null
    };
  }),
  
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
  
  // Load User Social Stats
  on(SocialActions.loadUserSocialStats, (state, { userId }) => ({
    ...state,
    userStatsLoading: { ...state.userStatsLoading, [userId]: true },
    error: null
  })),
  
  on(SocialActions.loadUserSocialStatsResult, (state, { userId, response }) => ({
    ...state,
    userStatsLoading: { ...state.userStatsLoading, [userId]: false },
    userSocialStats: response.success ? {
      ...state.userSocialStats,
      [userId]: response.data!
    } : state.userSocialStats,
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
export const getUserSocialStats = (state: SocialState) => state.userSocialStats;
export const getUserStatsLoading = (state: SocialState) => state.userStatsLoading;
export const getSearchResults = (state: SocialState) => state.searchResults;
export const getSearchLoading = (state: SocialState) => state.searchLoading;
export const getFollowing = (state: SocialState) => state.following;
export const getFollowingLoading = (state: SocialState) => state.followingLoading;
export const getFollowers = (state: SocialState) => state.followers;
export const getFollowersLoading = (state: SocialState) => state.followersLoading;
export const getSocialError = (state: SocialState) => state.error;