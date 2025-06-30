import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityService } from '../../services/activity.service';
import * as ActivityActions from '../actions/activity.actions';

@Injectable()
export class ActivityEffects {

  loadActivityFeed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.loadActivityFeed),
      switchMap(action =>
        this.activityService.getFeed(action.pageable).pipe(
          map(data => ActivityActions.loadActivityFeedResult({
            response: { data, success: true }
          })),
          catchError(error => of(ActivityActions.loadActivityFeedResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadMoreActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.loadMoreActivity),
      switchMap(action =>
        this.activityService.getFeedBefore(action.timestamp).pipe(
          map(data => ActivityActions.loadMoreActivityResult({
            response: { data, success: true }
          })),
          catchError(error => of(ActivityActions.loadMoreActivityResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  refreshActivityFeed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.refreshActivityFeed),
      switchMap(() =>
        this.activityService.getFeedSince(new Date(Date.now() - 24 * 60 * 60 * 1000)).pipe( // Last 24 hours
          map(data => ActivityActions.refreshActivityFeedResult({
            response: { data, success: true }
          })),
          catchError(error => of(ActivityActions.refreshActivityFeedResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  checkForNewActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.checkForNewActivity),
      switchMap(action =>
        this.activityService.hasNewEvents(action.timestamp).pipe(
          map(hasNew => ActivityActions.checkForNewActivityResult({ hasNew })),
          catchError(() => of(ActivityActions.checkForNewActivityResult({ hasNew: false })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private activityService: ActivityService
  ) {}
}