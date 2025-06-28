import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, exhaustMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocialService } from '../../services/social.service';
import * as SocialActions from '../actions/social.actions';

@Injectable()
export class SocialEffects {

  followUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.followUser),
      exhaustMap(action =>
        this.socialService.followUser(action.userId).pipe(
          map(data => SocialActions.followUserResult({
            userId: action.userId,
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.followUserResult({
            userId: action.userId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  unfollowUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.unfollowUser),
      exhaustMap(action =>
        this.socialService.unfollowUser(action.userId).pipe(
          map(() => SocialActions.unfollowUserResult({
            userId: action.userId,
            response: { success: true }
          })),
          catchError(error => of(SocialActions.unfollowUserResult({
            userId: action.userId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadFollowStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.loadFollowStatus),
      switchMap(action =>
        this.socialService.getFollowStatus(action.userId).pipe(
          map(data => SocialActions.loadFollowStatusResult({
            userId: action.userId,
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.loadFollowStatusResult({
            userId: action.userId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadSocialStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.loadSocialStats),
      switchMap(() =>
        this.socialService.getSocialStats().pipe(
          map(data => SocialActions.loadSocialStatsResult({
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.loadSocialStatsResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.searchUsers),
      switchMap(action =>
        this.socialService.searchUsers(action.search, action.pageable).pipe(
          map(data => SocialActions.searchUsersResult({
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.searchUsersResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadFollowing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.loadFollowing),
      switchMap(action =>
        this.socialService.getFollowing(action.pageable).pipe(
          map(data => SocialActions.loadFollowingResult({
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.loadFollowingResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadFollowers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocialActions.loadFollowers),
      switchMap(action =>
        this.socialService.getFollowers(action.pageable).pipe(
          map(data => SocialActions.loadFollowersResult({
            response: { data, success: true }
          })),
          catchError(error => of(SocialActions.loadFollowersResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private socialService: SocialService
  ) {}
}