import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DiscoverService } from '../../services/discover.service';
import * as DiscoverActions from '../actions/discover.actions';

@Injectable()
export class DiscoverEffects {

  discoverCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscoverActions.discoverCrates),
      switchMap(action =>
        this.discoverService.discoverCrates(action.pageable, action.search).pipe(
          map(data => DiscoverActions.discoverCratesResult({
            response: { data, success: true }
          })),
          catchError(error => of(DiscoverActions.discoverCratesResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  getUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscoverActions.getUserProfile),
      switchMap(action =>
        this.discoverService.getUserProfile(action.identifier).pipe(
          map(data => DiscoverActions.getUserProfileResult({
            response: { data, success: true }
          })),
          catchError(error => of(DiscoverActions.getUserProfileResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  getUserPublicCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DiscoverActions.getUserPublicCrates),
      switchMap(action =>
        this.discoverService.getUserPublicCrates(action.userId, action.pageable, action.search).pipe(
          map(data => DiscoverActions.getUserPublicCratesResult({
            response: { data, success: true }
          })),
          catchError(error => of(DiscoverActions.getUserPublicCratesResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private discoverService: DiscoverService
  ) {}
}