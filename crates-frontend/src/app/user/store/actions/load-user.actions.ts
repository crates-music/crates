import { createAction, props } from '@ngrx/store';
import { User } from '../../shared/model/user.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { ApiResponse } from '../../../shared/model/api-response.model';
import { Page } from '../../../shared/model/page.model';

export const loadUser = createAction('[User] Load User');
export const loadUserResult = createAction('[User] Load User Result', props<{ response: ApiResponse<User> }>());

export const loadUserById = createAction('[User] Load User By ID', props<{ userId: number }>());
export const loadUserByIdResult = createAction('[User] Load User By ID Result', props<{ userId: number; response: ApiResponse<User> }>());

export const loadUserPublicCrates = createAction('[User] Load User Public Crates', props<{ userId: number; search?: string }>());
export const loadUserPublicCratesResult = createAction('[User] Load User Public Crates Result', props<{ userId: number; response: ApiResponse<Page<Crate>> }>());

export const loadUserPublicCollection = createAction('[User] Load User Public Collection', props<{ userId: number; search?: string }>());
export const loadUserPublicCollectionResult = createAction('[User] Load User Public Collection Result', props<{ userId: number; response: ApiResponse<Page<Crate>> }>());

export const updateUserProfile = createAction('[User] Update User Profile', props<{ handle: string | null, bio: string | null, email: string | null, emailOptIn?: boolean, privateProfile?: boolean }>());
export const updateUserProfileResult = createAction('[User] Update User Profile Result', props<{ response: ApiResponse<User> }>());

export const clearUserProfile = createAction('[User] Clear User Profile');
