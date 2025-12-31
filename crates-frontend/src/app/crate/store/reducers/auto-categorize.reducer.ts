import { createReducer, on } from '@ngrx/store';
import { AutoCategorizePreview, AutoCategorizeResult } from '../../shared/model/auto-categorize.model';
import {
  previewAutoCategorize,
  previewAutoCategorizeSuccess,
  previewAutoCategorizeFailure,
  executeAutoCategorize,
  executeAutoCategorizeSuccess,
  executeAutoCategorizeFailure,
  resetAutoCategorize
} from '../actions/auto-categorize.actions';

export interface AutoCategorizeState {
  preview: AutoCategorizePreview | null;
  result: AutoCategorizeResult | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AutoCategorizeState = {
  preview: null,
  result: null,
  loading: false,
  error: null
};

export const autoCategorizeReducer = createReducer(
  initialState,

  // Preview actions
  on(previewAutoCategorize, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(previewAutoCategorizeSuccess, (state, { preview }) => ({
    ...state,
    preview,
    loading: false,
    error: null
  })),

  on(previewAutoCategorizeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Execute actions
  on(executeAutoCategorize, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(executeAutoCategorizeSuccess, (state, { result }) => ({
    ...state,
    result,
    loading: false,
    error: null
  })),

  on(executeAutoCategorizeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Reset
  on(resetAutoCategorize, () => initialState)
);
