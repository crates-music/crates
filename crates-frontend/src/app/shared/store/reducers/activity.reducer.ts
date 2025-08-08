import { createReducer, on } from '@ngrx/store';
import { CrateEvent } from '../../model/crate-event.model';
import { ActivityFeedResponse } from '../../model/activity.model';
import * as ActivityActions from '../actions/activity.actions';

export interface ActivityState {
  // Activity feed data
  feed: CrateEvent[];
  feedLoading: boolean;
  feedLoaded: boolean;
  hasNextPage: boolean;
  
  // Load more/infinite scroll state
  loadingMore: boolean;
  
  // Refresh state
  refreshing: boolean;
  hasNewActivity: boolean;
  lastRefreshTimestamp: Date | null;
  
  // Read state (for future use)
  lastReadTimestamp: Date | null;
  
  // Error state
  error: any;
}

export const initialState: ActivityState = {
  feed: [],
  feedLoading: false,
  feedLoaded: false,
  hasNextPage: false,
  loadingMore: false,
  refreshing: false,
  hasNewActivity: false,
  lastRefreshTimestamp: null,
  lastReadTimestamp: null,
  error: null
};

export const activityReducer = createReducer(
  initialState,
  
  // Load Activity Feed
  on(ActivityActions.loadActivityFeed, (state) => ({
    ...state,
    feedLoading: true,
    error: null
  })),
  
  on(ActivityActions.loadActivityFeedResult, (state, { response }) => ({
    ...state,
    feedLoading: false,
    feedLoaded: response.success,
    feed: response.success ? response.data!.content : [],
    hasNextPage: response.success ? !response.data!.last : false,
    error: response.success ? null : response.error
  })),
  
  // Load More Activity (Infinite Scroll)
  on(ActivityActions.loadMoreActivity, (state) => ({
    ...state,
    loadingMore: true,
    error: null
  })),
  
  on(ActivityActions.loadMoreActivityResult, (state, { response }) => {
    if (!response.success) {
      return {
        ...state,
        loadingMore: false,
        error: response.error
      };
    }
    
    // Handle both array and Page response structures
    const newEvents = Array.isArray(response.data) 
      ? response.data 
      : (response.data as any)?.content || [];
      
    return {
      ...state,
      loadingMore: false,
      feed: [...state.feed, ...newEvents],
      hasNextPage: newEvents.length > 0,
      error: null
    };
  }),
  
  // Refresh Activity Feed
  on(ActivityActions.refreshActivityFeed, (state) => ({
    ...state,
    refreshing: true,
    hasNewActivity: false,
    error: null
  })),
  
  on(ActivityActions.refreshActivityFeedResult, (state, { response }) => {
    if (!response.success) {
      return {
        ...state,
        refreshing: false,
        error: response.error
      };
    }
    
    const newEvents = response.data!;
    const updatedFeed = newEvents.length > 0 
      ? [...newEvents, ...state.feed]
      : state.feed;
    
    return {
      ...state,
      refreshing: false,
      feed: updatedFeed,
      lastRefreshTimestamp: new Date(),
      error: null
    };
  }),
  
  // Check for New Activity
  on(ActivityActions.checkForNewActivityResult, (state, { hasNew }) => ({
    ...state,
    hasNewActivity: hasNew
  })),
  
  // Mark Activity as Read
  on(ActivityActions.markActivityAsRead, (state, { timestamp }) => ({
    ...state,
    lastReadTimestamp: timestamp,
    hasNewActivity: false
  })),
  
  // Clear Actions
  on(ActivityActions.clearActivity, () => initialState),
  
  on(ActivityActions.clearActivityErrors, (state) => ({
    ...state,
    error: null
  }))
);

// Selector functions
export const getFeed = (state: ActivityState) => state.feed;
export const getFeedLoading = (state: ActivityState) => state.feedLoading;
export const getFeedLoaded = (state: ActivityState) => state.feedLoaded;
export const getHasNextPage = (state: ActivityState) => state.hasNextPage;
export const getLoadingMore = (state: ActivityState) => state.loadingMore;
export const getRefreshing = (state: ActivityState) => state.refreshing;
export const getHasNewActivity = (state: ActivityState) => state.hasNewActivity;
export const getLastRefreshTimestamp = (state: ActivityState) => state.lastRefreshTimestamp;
export const getLastReadTimestamp = (state: ActivityState) => state.lastReadTimestamp;
export const getActivityError = (state: ActivityState) => state.error;