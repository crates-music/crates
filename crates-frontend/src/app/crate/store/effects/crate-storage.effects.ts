import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { toggleCratesListType } from '../actions/load-crates.actions';
import { toggleCrateAlbumListType } from '../actions/crate-album.actions';
import { StateStorageService, StorageKey } from '../../../shared/services/list-type-storage.service';
import { ListType } from '../../../shared/model/list-type.model';

@Injectable()
export class CrateStorageEffects implements OnInitEffects {

  constructor(
    private actions$: Actions,
    private store: Store,
    private stateStorage: StateStorageService
  ) {}

  // Save crates list type to localStorage when it changes
  saveCratesListTypePreference$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleCratesListType),
      tap(action => {
        this.stateStorage.saveListType(StorageKey.CRATES_LIST_TYPE, action.listType);
      })
    ),
    { dispatch: false }
  );

  // Save crate albums list type to localStorage when it changes
  saveCrateAlbumsListTypePreference$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleCrateAlbumListType),
      tap(action => {
        this.stateStorage.saveListType(StorageKey.CRATE_ALBUMS_LIST_TYPE, action.listType);
      })
    ),
    { dispatch: false }
  );

  // Load preferences from localStorage on app init
  ngrxOnInitEffects(): Action {
    // Load crates list type preference and dispatch action
    const savedCratesListType = this.stateStorage.loadListType(StorageKey.CRATES_LIST_TYPE, ListType.List);
    const savedCrateAlbumsListType = this.stateStorage.loadListType(StorageKey.CRATE_ALBUMS_LIST_TYPE, ListType.List);
    
    // Dispatch both actions - effects will run after initial store setup
    setTimeout(() => {
      this.store.dispatch(toggleCratesListType({ listType: savedCratesListType }));
      this.store.dispatch(toggleCrateAlbumListType({ listType: savedCrateAlbumsListType }));
    }, 0);
    
    // Return a no-op action for OnInitEffects interface requirement
    return { type: '@crate-storage/init' };
  }
}