import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, exhaustMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CollectionService } from '../../services/collection.service';
import * as CollectionActions from '../actions/collection.actions';
import * as CrateActions from '../../../crate/store/actions/load-crates.actions';

@Injectable()
export class CollectionEffects {

  addCrateToCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionActions.addCrateToCollection),
      exhaustMap(action =>
        this.collectionService.addCrateToCollection(action.crateId).pipe(
          map(data => CollectionActions.addCrateToCollectionResult({ 
            crateId: action.crateId,
            response: { data, success: true }
          })),
          catchError(error => of(CollectionActions.addCrateToCollectionResult({
            crateId: action.crateId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  removeCrateFromCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionActions.removeCrateFromCollection),
      exhaustMap(action =>
        this.collectionService.removeCrateFromCollection(action.crateId).pipe(
          map(() => CollectionActions.removeCrateFromCollectionResult({
            crateId: action.crateId,
            response: { success: true }
          })),
          catchError(error => of(CollectionActions.removeCrateFromCollectionResult({
            crateId: action.crateId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadCollectionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionActions.loadCollectionStatus),
      switchMap(action =>
        this.collectionService.getCollectionStatus(action.crateId).pipe(
          map(data => CollectionActions.loadCollectionStatusResult({
            crateId: action.crateId,
            response: { data, success: true }
          })),
          catchError(error => of(CollectionActions.loadCollectionStatusResult({
            crateId: action.crateId,
            response: { success: false, error }
          })))
        )
      )
    )
  );

  loadMyCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionActions.loadMyCollection),
      switchMap(action =>
        this.collectionService.getMyCollection(action.pageable, action.search).pipe(
          map(data => CollectionActions.loadMyCollectionResult({
            response: { data, success: true }
          })),
          catchError(error => of(CollectionActions.loadMyCollectionResult({
            response: { success: false, error }
          })))
        )
      )
    )
  );

  // Reload crate data after successful collection changes
  reloadCrateAfterCollectionChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionActions.addCrateToCollectionResult, CollectionActions.removeCrateFromCollectionResult),
      switchMap(action => {
        if (action.response.success) {
          // Reload the specific crate to get updated follower count from API
          return of(CrateActions.loadCrate({ id: action.crateId }));
        }
        return of(); // Do nothing if action failed
      })
    )
  );

  constructor(
    private actions$: Actions,
    private collectionService: CollectionService
  ) {}
}