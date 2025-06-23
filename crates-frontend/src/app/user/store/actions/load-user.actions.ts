import { createAction, props } from '@ngrx/store';
import { User } from '../../shared/model/user.model';
import { ApiResponse } from '../../../shared/model/api-response.model';

export const loadUser = createAction('[User] Load User');
export const loadUserResult = createAction('[User] Load User Result', props<{ response: ApiResponse<User> }>());

export const updateUserProfile = createAction('[User] Update User Profile', props<{ handle: string | null, bio: string | null }>());
export const updateUserProfileResult = createAction('[User] Update User Profile Result', props<{ response: ApiResponse<User> }>());
