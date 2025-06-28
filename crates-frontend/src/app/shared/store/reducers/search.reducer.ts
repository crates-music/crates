import { createReducer, on } from '@ngrx/store';
import { UnifiedSearchResponse } from '../../model/unified-search.model';
import * as SearchActions from '../actions/search.actions';

export interface SearchState {
  query: string;
  results: UnifiedSearchResponse | null;
  loading: boolean;
  error: string | null;
}

export const initialState: SearchState = {
  query: '',
  results: null,
  loading: false,
  error: null
};

export const searchReducer = createReducer(
  initialState,
  on(SearchActions.search, (state, { query }) => ({
    ...state,
    query,
    loading: true,
    error: null
  })),
  on(SearchActions.searchResult, (state, { query, response }) => ({
    ...state,
    query,
    results: response.success ? response.data! : null,
    loading: false,
    error: response.success ? null : response.error?.message || 'Search failed'
  })),
  on(SearchActions.clearSearch, () => initialState)
);