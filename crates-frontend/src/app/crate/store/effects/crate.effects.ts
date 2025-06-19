import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CrateService } from '../../shared/crate.service';
import {
  loadCrate,
  loadCrateResult,
  loadCrates,
  loadCratesResult,
  reloadCrates,
  reloadCratesResult
} from '../actions/load-crates.actions';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';
import { ApiError } from '../../../shared/model/api-error.model';
import {
  addAlbumsToCrate,
  addAlbumToCrateResult,
  loadCrateAlbums,
  loadCrateAlbumsResult, reloadCrateAlbums, reloadCrateAlbumsResult,
  removeAlbumFromCrate,
  removeAlbumFromCrateResult
} from '../actions/crate-album.actions';
import { updateCrate, updateCrateResult } from '../actions/update-crate.actions';

@Injectable({
  providedIn: 'root'
})
export class CrateEffects {

  loadCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCrates),
      exhaustMap(action =>
        this.crateService.getCrates(action.pageable, action.search).pipe(
          map(crates => loadCratesResult({
            response: {
              data: crates,
              success: true
            }
          })),
          catchError(error => {
            console.error(loadCrates.type, error.error);
            return of(loadCratesResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error)
              }
            }))
          })
        ))
    ));

  reloadCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadCrates),
      exhaustMap(action =>
        this.crateService.getCrates(action.pageable, action.search).pipe(
          map(crates => reloadCratesResult({
            response: {
              data: crates,
              success: true
            }
          })),
          catchError(error => {
            console.error(loadCrates.type, error.error);
            return of(reloadCratesResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error)
              }
            }))
          })
        ))
    ));

  loadCrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCrate),
      exhaustMap(action =>
        this.crateService.getCrate(action.id).pipe(
          map(crate => loadCrateResult({
            response: {
              data: crate,
              success: true
            }
          })),
          catchError(error => {
            console.error(loadCrate.type, error.error);
            return of(loadCrateResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error)
              }
            }))
          })
        ))
    ));

  addAlbumsToCrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addAlbumsToCrate),
      exhaustMap(action =>
        this.crateService.addAlbumsToCrate(action.crate, action.albums).pipe(
          map(crate => addAlbumToCrateResult({
            albums: action.albums,
            response: {
              data: crate,
              success: true
            }
          })),
          catchError(error => {
            console.error(addAlbumsToCrate.type, error.error);
            return of(addAlbumToCrateResult({
              albums: action.albums,
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error),
              }
            }))
          })
        ))
    ));

  removeAlbumFromCrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeAlbumFromCrate),
      exhaustMap(action =>
        this.crateService.removeAlbumFromCrate(action.crate, action.album).pipe(
          map(crate => removeAlbumFromCrateResult({
            response: {
              data: crate,
              success: true
            }
          })),
          catchError(error => {
            console.error(removeAlbumFromCrate.type, error.error);
            return of(removeAlbumFromCrateResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error),
              }
            }))
          })
        ))
    ));

  removeAlbumFromCrateResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeAlbumFromCrateResult),
      filter(action => action.response.success),
      map(action => loadCrateResult({
        response: {
          success: true,
          data: action.response.data
        }
      }))
    ));


  loadCrateAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCrateAlbums),
      exhaustMap(action =>
        this.crateService.getCrateAlbums(action.crate, action.pageable).pipe(
          map(crateAlbums => loadCrateAlbumsResult({
              response: {
                data: crateAlbums,
                success: true,
              }
            }),
            catchError(error => {
              console.error(loadCrateAlbums.type, error.error);
              return of(loadCrateAlbumsResult({
                response: {
                  success: false,
                  error: Object.assign(new ApiError(), error.error),
                }
              }))
            }))
        ))
    ));

  reloadCrateAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadCrateAlbums),
      exhaustMap(action =>
        this.crateService.getCrateAlbums(action.crate, action.pageable, action.search).pipe(
          map(crateAlbums => reloadCrateAlbumsResult({
              response: {
                data: crateAlbums,
                success: true,
              }
            }),
            catchError(error => {
              console.error(reloadCrateAlbums.type, error.error);
              return of(reloadCrateAlbumsResult({
                response: {
                  success: false,
                  error: Object.assign(new ApiError(), error.error),
                }
              }))
            }))
        ))
    ));

  updateCrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateCrate),
      exhaustMap(action =>
        this.crateService.updateCrate(action.id, action.crateUpdate).pipe(
          map(crate => updateCrateResult({
            response: {
              data: crate,
              success: true
            }
          })),
          catchError(error => {
            console.error(updateCrate.type, error.error);
            return of(updateCrateResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error)
              }
            }))
          })
        ))
    ));

  updateCrateResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateCrateResult),
      filter(action => action.response.success),
      map(action => loadCrateResult({
        response: {
          success: true,
          data: action.response.data
        }
      }))
    ));

  constructor(private actions$: Actions,
              private crateService: CrateService) {
  }
}
