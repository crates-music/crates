import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../../shared/model/api-response.model';
import { Library } from '../../shared/model/library.model';

export const syncLibrary = createAction(
  '[Library] Sync Library',
);

export const syncLibraryResult = createAction(
  '[Library] Sync Library Result',
  props<{
    response: ApiResponse<Library>
  }>()
);

export const loadLibrary = createAction(
  '[Library] Load Library',
);

export const loadLibraryResult = createAction(
  '[Library] Load Library Result',
  props<{
    response: ApiResponse<Library>
  }>()
);
