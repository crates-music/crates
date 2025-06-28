import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchState } from '../reducers/search.reducer';

export const selectSearchState = createFeatureSelector<SearchState>('search');

export const selectSearchQuery = createSelector(
  selectSearchState,
  (state: SearchState) => state.query
);

export const selectSearchResults = createSelector(
  selectSearchState,
  (state: SearchState) => state.results
);

export const selectSearchLoading = createSelector(
  selectSearchState,
  (state: SearchState) => state.loading
);

export const selectSearchError = createSelector(
  selectSearchState,
  (state: SearchState) => state.error
);

export const selectSearchUsers = createSelector(
  selectSearchResults,
  (results) => results?.users || []
);

export const selectSearchCrates = createSelector(
  selectSearchResults,
  (results) => results?.crates || []
);