import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LibraryService } from '../../shared/services/library.service';
import { loadAlbums, loadAlbumsResult, reloadAlbums, triggerInfiniteScroll } from '../actions/load-albums.actions';
import { catchError, exhaustMap, filter, map, of, Subject, tap, withLatestFrom } from 'rxjs';
import { ApiError } from '../../../shared/model/api-error.model';
import { loadLibrary, loadLibraryResult, syncLibrary, syncLibraryResult } from '../actions/sync.actions';
import {
  selectAlbumPageable,
  selectHideCrated,
  selectLibraryFilters,
  selectLibrarySearch
} from '../selectors/library.selectors';
import { Store } from '@ngrx/store';
import { removeAlbumFromCrateResult } from '../../../crate/store/actions/crate-album.actions';
import { LibraryAlbumFilter } from '../../shared/model/library-album-filter.enum';

@Injectable({
  providedIn: 'root'
})
export class LibraryEffects {

  loadAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAlbums, reloadAlbums),
      withLatestFrom(this.store.select(selectHideCrated)),
      exhaustMap(([action, hideCrated]) =>
        this.libraryService.getAlbums(
          action.pageable,
          action.search,
          hideCrated ? [LibraryAlbumFilter.ExcludeCrated] : action.filters).pipe(
          map(albums => loadAlbumsResult({
            response: {
              data: albums,
              success: true
            },
          })),
          catchError(error => {
            console.error(loadAlbums.type, error.error);
            return of(loadAlbumsResult({
              response: {
                success: false,
                error: Object.assign(new ApiError(), error.error),
              }
            }));
          })
        )
      ))
  );

  syncLibrary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(syncLibrary),
      exhaustMap(action =>
        this.libraryService.synchronize().pipe(
          map(library => syncLibraryResult({
            response: {
              data: library,
              success: true,
            }
          })),
          catchError(error => {
            console.error(syncLibrary.type, error.error);
            return of(syncLibraryResult({
              response: {
                success: false,
                error,
              }
            }))
          })
        )
      )));

  syncLibraryResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(syncLibraryResult),
      filter(action => !!action.response.success),
      withLatestFrom(
        this.store.select(selectLibraryFilters),
        this.store.select(selectLibrarySearch),
        this.store.select(selectAlbumPageable)),
      map(([action, filters, search, pageable]) => reloadAlbums({
        pageable,
        filters,
        search
      }))
    ));

  removeAlbumFromCrateResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeAlbumFromCrateResult),
      filter(action => !!action.response.success),
      withLatestFrom(
        this.store.select(selectLibraryFilters),
        this.store.select(selectLibrarySearch),
        this.store.select(selectAlbumPageable)),
      map(([_, filters, search, pageable]) => reloadAlbums({
        pageable,
        filters,
        search
      }))
    ));

  loadLibrary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadLibrary),
      exhaustMap(action =>
        this.libraryService.getLibrary().pipe(
          map(library => loadLibraryResult({
            response: {
              data: library,
              success: true,
            }
          })),
          catchError(error => {
            console.error(syncLibrary.type, error.error);
            return of(loadLibraryResult({
              response: {
                success: false,
                error,
              }
            }))
          })
        )
      )));

  triggerInfiniteScroll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(triggerInfiniteScroll),
      withLatestFrom(
        this.store.select(selectAlbumPageable),
        this.store.select(selectHideCrated)
      ),
      map(([_, pageable, hideCrated]) => {
        console.log('Infinite scroll triggered via NgRx!');
        return loadAlbums({
          pageable: pageable.nextPageable(),
          filters: hideCrated ? [LibraryAlbumFilter.ExcludeCrated] : []
        });
      })
    ));

  constructor(private actions$: Actions,
              private libraryService: LibraryService,
              private store: Store) {
  }

  private syncPollingUntil$ = new Subject<boolean>();
}
