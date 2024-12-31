import { createAction, props } from '@ngrx/store';
import { Album } from '../../shared/model/album.model';

export const toggleAlbumSelection = createAction(
  '[Library] Toggle Album Selection',
  props<{
    album: Album,
  }>());

export const clearAlbumSelection = createAction(
  '[Library] Clear Album Selection'
);
