import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs/operators';
import { toggleListType } from '../actions/library-option.actions';
import { selectLibraryListType } from '../selectors/library.selectors';
import { StateStorageService, StorageKey } from '../../../shared/services/list-type-storage.service';
import { ListType } from '../../../shared/model/list-type.model';

@Injectable()
export class LibraryStorageEffects implements OnInitEffects {

  constructor(
    private actions$: Actions,
    private store: Store,
    private stateStorage: StateStorageService
  ) {}

  // Save list type to localStorage when it changes
  saveListTypePreference$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleListType),
      tap(action => {
        this.stateStorage.saveListType(StorageKey.LIBRARY_LIST_TYPE, action.listType);
      })
    ),
    { dispatch: false }
  );

  // Load preferences from localStorage on app init
  ngrxOnInitEffects(): Action {
    const savedListType = this.stateStorage.loadListType(StorageKey.LIBRARY_LIST_TYPE, ListType.List);
    return toggleListType({ listType: savedListType });
  }
}