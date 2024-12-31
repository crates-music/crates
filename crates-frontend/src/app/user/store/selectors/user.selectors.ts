import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUser from '../reducers/user.reducer';

export const selectUserState = createFeatureSelector<fromUser.UserState>('user');

export const selectUser = createSelector(selectUserState, fromUser.getUser);
export const selectUserLoading = createSelector(selectUserState, fromUser.getUserLoading);
export const selectUserLoaded = createSelector(selectUserState, fromUser.getUserLoaded);
export const selectUserError = createSelector(selectUserState, fromUser.getUserError);

