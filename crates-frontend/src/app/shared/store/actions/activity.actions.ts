import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../model/api-response.model';
import { Pageable } from '../../model/pageable.model';
import { CrateEvent } from '../../model/crate-event.model';
import { ActivityFeedResponse } from '../../model/activity.model';

// Load Activity Feed Actions
export const loadActivityFeed = createAction(
  '[Activity] Load Activity Feed',
  props<{ pageable: Pageable }>()
);

export const loadActivityFeedResult = createAction(
  '[Activity] Load Activity Feed Result',
  props<{ response: ApiResponse<ActivityFeedResponse> }>()
);

// Load More Activity (Infinite Scroll)
export const loadMoreActivity = createAction(
  '[Activity] Load More Activity',
  props<{ timestamp: Date }>()
);

export const loadMoreActivityResult = createAction(
  '[Activity] Load More Activity Result',
  props<{ response: ApiResponse<CrateEvent[]> }>()
);

// Refresh Activity Feed
export const refreshActivityFeed = createAction('[Activity] Refresh Activity Feed');

export const refreshActivityFeedResult = createAction(
  '[Activity] Refresh Activity Feed Result',
  props<{ response: ApiResponse<CrateEvent[]> }>()
);

// Check for New Activity
export const checkForNewActivity = createAction(
  '[Activity] Check For New Activity',
  props<{ timestamp: Date }>()
);

export const checkForNewActivityResult = createAction(
  '[Activity] Check For New Activity Result',
  props<{ hasNew: boolean }>()
);

// Mark Activity as Read (for future use)
export const markActivityAsRead = createAction(
  '[Activity] Mark Activity As Read',
  props<{ timestamp: Date }>()
);

// Clear Actions
export const clearActivity = createAction('[Activity] Clear Activity');
export const clearActivityErrors = createAction('[Activity] Clear Activity Errors');