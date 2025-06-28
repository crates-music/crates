import { createAction, props } from '@ngrx/store';
import { ApiResponse } from '../../model/api-response.model';
import { CollectionStatus, CollectionResponse } from '../../model/social-stats.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Page } from '../../model/page.model';
import { Pageable } from '../../model/pageable.model';

// Add/Remove Crate to/from Collection
export const addCrateToCollection = createAction(
  '[Collection] Add Crate to Collection',
  props<{ crateId: number }>()
);

export const addCrateToCollectionResult = createAction(
  '[Collection] Add Crate to Collection Result',
  props<{ crateId: number; response: ApiResponse<CollectionResponse> }>()
);

export const removeCrateFromCollection = createAction(
  '[Collection] Remove Crate from Collection',
  props<{ crateId: number }>()
);

export const removeCrateFromCollectionResult = createAction(
  '[Collection] Remove Crate from Collection Result',
  props<{ crateId: number; response: ApiResponse<void> }>()
);

// Collection Status
export const loadCollectionStatus = createAction(
  '[Collection] Load Collection Status',
  props<{ crateId: number }>()
);

export const loadCollectionStatusResult = createAction(
  '[Collection] Load Collection Status Result',
  props<{ crateId: number; response: ApiResponse<CollectionStatus> }>()
);

// User's Collection
export const loadMyCollection = createAction(
  '[Collection] Load My Collection',
  props<{ pageable: Pageable; search?: string }>()
);

export const loadMyCollectionResult = createAction(
  '[Collection] Load My Collection Result',
  props<{ response: ApiResponse<Page<Crate>> }>()
);

// Clear Actions
export const clearCollectionErrors = createAction('[Collection] Clear Collection Errors');