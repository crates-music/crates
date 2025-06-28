import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../model/api-response.model';
import { User } from '../../../user/shared/model/user.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Page } from '../../model/page.model';
import { Pageable } from '../../model/pageable.model';

// Discover Crates
export const discoverCrates = createAction(
  '[Discover] Discover Crates',
  props<{ pageable: Pageable; search?: string }>()
);

export const discoverCratesResult = createAction(
  '[Discover] Discover Crates Result',
  props<{ response: ApiResponse<Page<Crate>> }>()
);

// User Profile Discovery
export const getUserProfile = createAction(
  '[Discover] Get User Profile',
  props<{ identifier: string }>()
);

export const getUserProfileResult = createAction(
  '[Discover] Get User Profile Result',
  props<{ response: ApiResponse<User> }>()
);

// User's Public Crates
export const getUserPublicCrates = createAction(
  '[Discover] Get User Public Crates',
  props<{ userId: number; pageable: Pageable; search?: string }>()
);

export const getUserPublicCratesResult = createAction(
  '[Discover] Get User Public Crates Result',
  props<{ response: ApiResponse<Page<Crate>> }>()
);

// Clear Actions
export const clearDiscoverResults = createAction('[Discover] Clear Discover Results');
export const clearDiscoverErrors = createAction('[Discover] Clear Discover Errors');