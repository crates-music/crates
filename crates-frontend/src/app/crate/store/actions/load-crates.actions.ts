import { createAction, props } from '@ngrx/store';
import { Pageable } from '../../../shared/model/pageable.model';
import { ApiResponse } from '../../../shared/model/api-response.model';
import { Crate } from '../../shared/model/crate.model';
import { Page } from '../../../shared/model/page.model';
import { ListType } from '../../../shared/model/list-type.model';

export const loadCrates = createAction(
  '[Crate] Load Crates',
  props<{
    pageable: Pageable,
    search?: string
  }>()
);

export const loadCratesResult = createAction(
  '[Crate] Load Crates Result',
  props<{ response: ApiResponse<Page<Crate>>; }>());

export const reloadCrates = createAction(
  '[Crate] Reload Crates',
  props<{
    pageable: Pageable,
    search?: string
  }>()
);

export const reloadCratesResult = createAction(
  '[Crate] Reload Crates Result',
  props<{ response: ApiResponse<Page<Crate>>; }>());

export const loadCrate = createAction(
  '[Crate] Load Crate',
  props<{
    id: number
  }>()
);

export const loadCrateResult = createAction(
  '[Crate] Load Crate Result',
  props<{ response: ApiResponse<Crate>; }>());

export const toggleCratesListType = createAction(
  '[Crates] Toggle List Type',
  props<{
    listType: ListType
  }>()
);
