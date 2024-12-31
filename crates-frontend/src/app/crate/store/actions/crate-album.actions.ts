import { createAction, props } from '@ngrx/store';
import { Crate } from '../../shared/model/crate.model';
import { Album } from '../../../library/shared/model/album.model';
import { ApiResponse } from '../../../shared/model/api-response.model';
import { Pageable } from '../../../shared/model/pageable.model';
import { Page } from '../../../shared/model/page.model';
import { CrateAlbum } from '../../shared/model/crate-album.model';
import { ListType } from '../../../shared/model/list-type.model';

export const addAlbumsToCrate = createAction(
  '[Crate] Add Albums to Crate',
  props<{
    crate: Crate,
    albums: Album[]
  }>()
);

export const addAlbumToCrateResult = createAction(
  '[Crate] Add Albums to Crate Result',
  props<{
    albums: Album[],
    response: ApiResponse<Crate>;
  }>());

export const removeAlbumFromCrate = createAction(
  '[Crate] Remove Album from Crate',
  props<{
    crate: Crate,
    album: Album
  }>()
);

export const removeAlbumFromCrateResult = createAction(
  '[Crate] Remove Album from Crate Result',
  props<{
    response: ApiResponse<Crate>;
  }>());

export const loadCrateAlbums = createAction(
  '[Crate] Load Crate Albums',
  props<{
    crate: Crate,
    pageable: Pageable,
    search?: string
  }>()
);

export const loadCrateAlbumsResult = createAction(
  '[Crate] Load Crate Albums Result',
  props<{
    response: ApiResponse<Page<CrateAlbum>>
  }>()
);

export const reloadCrateAlbums = createAction(
  '[Crate] Reload Crate Albums',
  props<{
    crate: Crate,
    pageable: Pageable,
    search?: string
  }>()
);

export const reloadCrateAlbumsResult = createAction(
  '[Crate] Reload Crate Albums Result',
  props<{
    response: ApiResponse<Page<CrateAlbum>>
  }>()
);

export const toggleCrateAlbumListType = createAction(
  '[Crates] Toggle Crate Album List Type',
  props<{
    listType: ListType
  }>()
);
