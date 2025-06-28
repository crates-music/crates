import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';
import { SearchService } from '../../services/search.service';
import * as SearchActions from '../actions/search.actions';

@Injectable()
export class SearchEffects {

  constructor(
    private actions$: Actions,
    private searchService: SearchService
  ) {}

  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.search),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.query === curr.query),
      switchMap(action =>
        this.searchService.search(action.query, action.pageable).pipe(
          map(data => SearchActions.searchResult({ 
            query: action.query, 
            response: { data, success: true } 
          })),
          catchError(error => of(SearchActions.searchResult({ 
            query: action.query, 
            response: { success: false, error: error.message } 
          })))
        )
      )
    )
  );
}