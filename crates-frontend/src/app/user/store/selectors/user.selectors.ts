import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUser from '../reducers/user.reducer';

export const selectUserState = createFeatureSelector<fromUser.UserState>('user');

export const selectUser = createSelector(selectUserState, fromUser.getUser);
export const selectUserLoading = createSelector(selectUserState, fromUser.getUserLoading);
export const selectUserLoaded = createSelector(selectUserState, fromUser.getUserLoaded);
export const selectUserError = createSelector(selectUserState, fromUser.getUserError);

export const selectViewedUser = createSelector(selectUserState, fromUser.getViewedUser);
export const selectViewedUserLoading = createSelector(selectUserState, fromUser.getViewedUserLoading);
export const selectViewedUserLoaded = createSelector(selectUserState, fromUser.getViewedUserLoaded);
export const selectViewedUserError = createSelector(selectUserState, fromUser.getViewedUserError);

export const selectViewedUserCrates = createSelector(selectUserState, fromUser.getViewedUserCrates);
export const selectViewedUserCratesLoading = createSelector(selectUserState, fromUser.getViewedUserCratesLoading);
export const selectViewedUserCratesLoaded = createSelector(selectUserState, fromUser.getViewedUserCratesLoaded);
export const selectViewedUserCratesError = createSelector(selectUserState, fromUser.getViewedUserCratesError);

export const selectViewedUserCollection = createSelector(selectUserState, fromUser.getViewedUserCollection);
export const selectViewedUserCollectionLoading = createSelector(selectUserState, fromUser.getViewedUserCollectionLoading);
export const selectViewedUserCollectionLoaded = createSelector(selectUserState, fromUser.getViewedUserCollectionLoaded);
export const selectViewedUserCollectionError = createSelector(selectUserState, fromUser.getViewedUserCollectionError);

