import { createAction, props } from '@ngrx/store';
import { Pageable } from '../../model/pageable.model';
import { UnifiedSearchResponse } from '../../model/unified-search.model';
import { ApiResponse } from '../../model/api-response.model';

export const search = createAction(
  '[Search] Search',
  props<{ query: string; pageable: Pageable }>()
);

export const searchResult = createAction(
  '[Search] Search Result',
  props<{ query: string; response: ApiResponse<UnifiedSearchResponse> }>()
);

export const clearSearch = createAction(
  '[Search] Clear Search'
);