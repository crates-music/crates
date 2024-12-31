import { createAction, props } from '@ngrx/store';
import { User } from '../../shared/model/user.model';
import { ApiResponse } from '../../../shared/model/api-response.model';

export const loadUser = createAction('[User] Load User');
export const loadUserResult = createAction('[User] Load User Result', props<{ response: ApiResponse<User> }>());
