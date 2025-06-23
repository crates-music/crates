import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../../shared/model/api-response.model';
import { Pageable } from '../../../shared/model/pageable.model';
import { Album } from '../../shared/model/album.model';
import { Page } from '../../../shared/model/page.model';
import { LibraryAlbumFilter } from '../../shared/model/library-album-filter.enum';

export const loadAlbums = createAction(
  '[Library] Load Albums',
  props<{
    pageable: Pageable,
    search?: string,
    filters: LibraryAlbumFilter[]
  }>());
export const loadAlbumsResult = createAction(
  '[Library] Load Albums Result',
  props<{ response: ApiResponse<Page<Album>> }>());

export const reloadAlbums = createAction(
  '[Library] Reload Albums',
  props<{
    pageable: Pageable,
    search?: string,
    filters: LibraryAlbumFilter[]
  }>());

export const triggerInfiniteScroll = createAction(
  '[Library] Trigger Infinite Scroll');
