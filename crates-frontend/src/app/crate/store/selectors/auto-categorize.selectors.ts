import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AutoCategorizeState } from '../reducers/auto-categorize.reducer';

export const selectAutoCategorizeState = createFeatureSelector<AutoCategorizeState>('autoCategorize');

export const selectAutoCategorizePreview = createSelector(
  selectAutoCategorizeState,
  (state) => state.preview
);

export const selectAutoCategorizeResult = createSelector(
  selectAutoCategorizeState,
  (state) => state.result
);

export const selectAutoCategorizeLoading = createSelector(
  selectAutoCategorizeState,
  (state) => state.loading
);

export const selectAutoCategorizeError = createSelector(
  selectAutoCategorizeState,
  (state) => state.error
);
