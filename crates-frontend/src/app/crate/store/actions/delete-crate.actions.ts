import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../../shared/model/api-response.model';

export const deleteCrate = createAction(
  '[Crate] Delete Crate',
  props<{ id: number }>()
);

export const deleteCrateResult = createAction(
  '[Crate] Delete Crate Result',
  props<{ id: number; response: ApiResponse<void> }>()
);
