import { createAction, props } from '@ngrx/store';
import { Pageable } from '../../model/pageable.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { ApiResponse } from '../../model/api-response.model';
import { Page } from '../../model/page.model';

export const loadTrendingCrates = createAction(
  '[Trending] Load Trending Crates',
  props<{ pageable: Pageable }>()
);

export const loadTrendingCratesSuccess = createAction(
  '[Trending] Load Trending Crates Success',
  props<{ response: ApiResponse<Page<Crate>> }>()
);

export const loadTrendingCratesFailure = createAction(
  '[Trending] Load Trending Crates Failure',
  props<{ error: any }>()
);

export const loadRecentCrates = createAction(
  '[Trending] Load Recent Crates',
  props<{ pageable: Pageable }>()
);

export const loadRecentCratesSuccess = createAction(
  '[Trending] Load Recent Crates Success',
  props<{ response: ApiResponse<Page<Crate>> }>()
);

export const loadRecentCratesFailure = createAction(
  '[Trending] Load Recent Crates Failure',
  props<{ error: any }>()
);

export const clearTrendingCrates = createAction(
  '[Trending] Clear Trending Crates'
);

export const recordCrateView = createAction(
  '[Trending] Record Crate View',
  props<{ crateId: number }>()
);