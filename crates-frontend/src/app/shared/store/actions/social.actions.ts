import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../model/api-response.model';
import { UserFollow } from '../../model/user-follow.model';
import { SocialStats, FollowStatus } from '../../model/social-stats.model';
import { User } from '../../../user/shared/model/user.model';
import { Page } from '../../model/page.model';
import { Pageable } from '../../model/pageable.model';

// Follow/Unfollow Actions
export const followUser = createAction(
  '[Social] Follow User',
  props<{ userId: number }>()
);

export const followUserResult = createAction(
  '[Social] Follow User Result',
  props<{ userId: number; response: ApiResponse<UserFollow> }>()
);

export const unfollowUser = createAction(
  '[Social] Unfollow User',
  props<{ userId: number }>()
);

export const unfollowUserResult = createAction(
  '[Social] Unfollow User Result',
  props<{ userId: number; response: ApiResponse<void> }>()
);

// Follow Status Actions
export const loadFollowStatus = createAction(
  '[Social] Load Follow Status',
  props<{ userId: number }>()
);

export const loadFollowStatusResult = createAction(
  '[Social] Load Follow Status Result',
  props<{ userId: number; response: ApiResponse<FollowStatus> }>()
);

// Social Stats Actions
export const loadSocialStats = createAction('[Social] Load Social Stats');

export const loadSocialStatsResult = createAction(
  '[Social] Load Social Stats Result',
  props<{ response: ApiResponse<SocialStats> }>()
);

export const loadUserSocialStats = createAction(
  '[Social] Load User Social Stats',
  props<{ userId: number }>()
);

export const loadUserSocialStatsResult = createAction(
  '[Social] Load User Social Stats Result',
  props<{ userId: number; response: ApiResponse<SocialStats> }>()
);

// User Search Actions
export const searchUsers = createAction(
  '[Social] Search Users',
  props<{ search: string; pageable: Pageable }>()
);

export const searchUsersResult = createAction(
  '[Social] Search Users Result',
  props<{ response: ApiResponse<Page<User>> }>()
);

// Following/Followers Lists
export const loadFollowing = createAction(
  '[Social] Load Following',
  props<{ pageable: Pageable }>()
);

export const loadFollowingResult = createAction(
  '[Social] Load Following Result',
  props<{ response: ApiResponse<Page<UserFollow>> }>()
);

export const loadFollowers = createAction(
  '[Social] Load Followers',
  props<{ pageable: Pageable }>()
);

export const loadFollowersResult = createAction(
  '[Social] Load Followers Result',
  props<{ response: ApiResponse<Page<UserFollow>> }>()
);

// Clear Actions
export const clearSearchResults = createAction('[Social] Clear Search Results');
export const clearSocialErrors = createAction('[Social] Clear Social Errors');