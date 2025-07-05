import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TrendingState } from '../reducers/trending.reducer';

export const selectTrendingState = createFeatureSelector<TrendingState>('trending');

export const selectTrendingCrates = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.trendingCrates.value?.content || []
);

export const selectTrendingCratesLoading = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.trendingCrates.loading
);

export const selectTrendingCratesError = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.trendingCrates.error
);

export const selectRecentCrates = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.recentCrates.value?.content || []
);

export const selectRecentCratesLoading = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.recentCrates.loading
);

export const selectRecentCratesError = createSelector(
  selectTrendingState,
  (state: TrendingState) => state.recentCrates.error
);