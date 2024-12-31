import { createAction, props } from '@ngrx/store';
import { ListType } from '../../../shared/model/list-type.model';

export const hideCratedAlbums = createAction(
  '[Library] Hide Crated Albums',
);

export const showCratedAlbums = createAction(
  '[Library] Show Crated Albums'
);

export const toggleListType = createAction(
  '[Library] Toggle List Type',
  props<{
    listType: ListType
  }>()
);
