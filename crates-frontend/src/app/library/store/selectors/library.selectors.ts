import * as fromLibrary from '../reducers/library.reducer'
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const selectLibraryState = createFeatureSelector<fromLibrary.LibraryState>('library');

export const selectAlbumsState = createSelector(selectLibraryState, state => state.albums.value);
export const selectAllAlbums = createSelector(selectAlbumsState, fromLibrary.selectAll);
export const selectAlbumsLoading = createSelector(selectLibraryState, state => state.albums.loading);
export const selectAlbumsLoaded = createSelector(selectLibraryState, state => state.albums.loaded);
export const selectAlbumsError = createSelector(selectLibraryState, state => state.albums.error);
export const selectAlbumsHasNextPage = createSelector(selectLibraryState, state => state.albums.hasNextPage);
export const selectAlbumPageable = createSelector(selectLibraryState, state => state.albumPageable);

export const selectLibraryFilters = createSelector(selectLibraryState, state => state.filters);
export const selectLibrarySearch = createSelector(selectLibraryState, state => state.search);

export const selectLibrary = createSelector(selectLibraryState, state => state.library.value);
export const selectLibraryLoaded = createSelector(selectLibraryState, state => state.library.loaded);
export const selectLibraryLoading = createSelector(selectLibraryState, state => state.library.loading);

export const selectHideCrated = createSelector(selectLibraryState, state => state.hideCrated);
export const selectLibraryListType = createSelector(selectLibraryState, state => state.listType);

export const selectSelectedAlbums = createSelector(selectAllAlbums, albums => 
  albums.filter(album => album.selected)
);
export const selectSelectedAlbumCount = createSelector(selectSelectedAlbums, albums => albums.length);
export const selectHasSelectedAlbums = createSelector(selectSelectedAlbumCount, count => count > 0);
