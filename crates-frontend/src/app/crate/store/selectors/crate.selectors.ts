import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromCrate from '../reducers/crate.reducer';

export const selectCrateState = createFeatureSelector<fromCrate.CrateState>('crate');
export const selectCratesState = createSelector(selectCrateState, state => state.crates.value);
// crate list
export const selectAllCrates = createSelector(selectCratesState, fromCrate.selectAll);
export const selectCratesLoading = createSelector(selectCrateState, state => state.crates.loading);
export const selectCratesLoaded = createSelector(selectCrateState, state => state.crates.loaded);
export const selectCratesError = createSelector(selectCrateState, state => state.crates.error);
export const selectCratesHasNextPage = createSelector(selectCrateState, state => state.crates.hasNextPage);
export const selectCratesListType = createSelector(selectCrateState, state => state.listType);
export const selectCratesSearch = createSelector(selectCrateState, state => state.search);
// individual crate
export const selectCrate = createSelector(selectCrateState, state => state.crate.value);
export const selectCrateLoading = createSelector(selectCrateState, state => state.crate.loading);
export const selectCrateLoaded = createSelector(selectCrateState, state => state.crate.loaded);
export const selectCrateError = createSelector(selectCrateState, state => state.crate.error);
// crate albums
export const selectCrateAlbumsState = createSelector(selectCrateState, state => state.crateAlbums.value)
export const selectAllCrateAlbums = createSelector(selectCrateAlbumsState, fromCrate.selectAllCrateAlbums);
export const selectCrateAlbumsLoading = createSelector(selectCrateState, state => state.crateAlbums.loading);
export const selectCrateAlbumsLoaded = createSelector(selectCrateState, state => state.crateAlbums.loaded);
export const selectCrateAlbumsHasNextPage = createSelector(selectCrateState, state => state.crateAlbums.hasNextPage);
export const selectCrateAlbumListType = createSelector(selectCrateState, state => state.crateAlbumListType);
