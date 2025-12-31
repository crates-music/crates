import { createAction, props } from '@ngrx/store';
import { AutoCategorizePreview, AutoCategorizeResult } from '../../shared/model/auto-categorize.model';

// Preview actions
export const previewAutoCategorize = createAction(
  '[Auto-Categorize] Preview'
);

export const previewAutoCategorizeSuccess = createAction(
  '[Auto-Categorize] Preview Success',
  props<{ preview: AutoCategorizePreview }>()
);

export const previewAutoCategorizeFailure = createAction(
  '[Auto-Categorize] Preview Failure',
  props<{ error: string }>()
);

// Execute actions
export const executeAutoCategorize = createAction(
  '[Auto-Categorize] Execute'
);

export const executeAutoCategorizeSuccess = createAction(
  '[Auto-Categorize] Execute Success',
  props<{ result: AutoCategorizeResult }>()
);

export const executeAutoCategorizeFailure = createAction(
  '[Auto-Categorize] Execute Failure',
  props<{ error: string }>()
);

// Reset action
export const resetAutoCategorize = createAction(
  '[Auto-Categorize] Reset'
);
