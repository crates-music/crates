import { createAction, props } from '@ngrx/store';
import { Crate } from '../../shared/model/crate.model';
import { ApiResponse } from '../../../shared/model/api-response.model';

export const updateCrate = createAction(
  '[Crate] Update Crate',
  props<{ id: number; crateUpdate: Partial<Crate> }>()
);

export const updateCrateResult = createAction(
  '[Crate] Update Crate Result',
  props<{ response: ApiResponse<Crate> }>()
);