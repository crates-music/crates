import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ActivityState } from '../reducers/activity.reducer';
import * as fromActivity from '../reducers/activity.reducer';

export const selectActivityState = createFeatureSelector<ActivityState>('activity');

// Feed Selectors
export const selectActivityFeed = createSelector(
  selectActivityState,
  fromActivity.getFeed
);

export const selectFeedLoading = createSelector(
  selectActivityState,
  fromActivity.getFeedLoading
);

export const selectFeedLoaded = createSelector(
  selectActivityState,
  fromActivity.getFeedLoaded
);

export const selectHasNextPage = createSelector(
  selectActivityState,
  fromActivity.getHasNextPage
);

// Infinite Scroll Selectors
export const selectLoadingMore = createSelector(
  selectActivityState,
  fromActivity.getLoadingMore
);

// Refresh Selectors
export const selectRefreshing = createSelector(
  selectActivityState,
  fromActivity.getRefreshing
);

export const selectHasNewActivity = createSelector(
  selectActivityState,
  fromActivity.getHasNewActivity
);

export const selectLastRefreshTimestamp = createSelector(
  selectActivityState,
  fromActivity.getLastRefreshTimestamp
);

// Read Status Selectors
export const selectLastReadTimestamp = createSelector(
  selectActivityState,
  fromActivity.getLastReadTimestamp
);

// Error Selectors
export const selectActivityError = createSelector(
  selectActivityState,
  fromActivity.getActivityError
);

// Computed Selectors
export const selectIsActivityLoading = createSelector(
  selectFeedLoading,
  selectLoadingMore,
  selectRefreshing,
  (feedLoading, loadingMore, refreshing) => feedLoading || loadingMore || refreshing
);

export const selectCanLoadMore = createSelector(
  selectHasNextPage,
  selectLoadingMore,
  selectFeedLoading,
  (hasNextPage, loadingMore, feedLoading) => hasNextPage && !loadingMore && !feedLoading
);

export const selectFeedItems = createSelector(
  selectActivityFeed,
  (feed) => feed || []
);