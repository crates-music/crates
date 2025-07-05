import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TrendingService } from '../../services/trending.service';
import * as TrendingActions from '../actions/trending.actions';

@Injectable()
export class TrendingEffects {

  loadTrendingCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrendingActions.loadTrendingCrates),
      switchMap(({ pageable }) =>
        this.trendingService.getTrendingCrates(pageable).pipe(
          map(data => TrendingActions.loadTrendingCratesSuccess({ 
            response: { data, success: true } 
          })),
          catchError(error => of(TrendingActions.loadTrendingCratesFailure({ error })))
        )
      )
    )
  );

  loadRecentCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrendingActions.loadRecentCrates),
      switchMap(({ pageable }) =>
        this.trendingService.getRecentCrates(pageable).pipe(
          map(data => TrendingActions.loadRecentCratesSuccess({ 
            response: { data, success: true } 
          })),
          catchError(error => of(TrendingActions.loadRecentCratesFailure({ error })))
        )
      )
    )
  );

  recordCrateView$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrendingActions.recordCrateView),
      switchMap(({ crateId }) =>
        this.trendingService.recordCrateView(crateId).pipe(
          map(() => ({ type: 'NO_ACTION' })), // Don't dispatch any action on success
          catchError(() => of({ type: 'NO_ACTION' })) // Ignore errors for view tracking
        )
      )
    ), 
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private trendingService: TrendingService
  ) {}
}