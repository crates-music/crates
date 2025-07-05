import { createReducer, on } from '@ngrx/store';
import { Loadable } from '../../model/loadable.model';
import { Page } from '../../model/page.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import * as TrendingActions from '../actions/trending.actions';

export interface TrendingState {
  trendingCrates: Loadable<Page<Crate>>;
  recentCrates: Loadable<Page<Crate>>;
}

export const initialState: TrendingState = {
  trendingCrates: { loading: false, loaded: false },
  recentCrates: { loading: false, loaded: false }
};

export const trendingReducer = createReducer(
  initialState,

  // Trending crates
  on(TrendingActions.loadTrendingCrates, (state) => ({
    ...state,
    trendingCrates: { loading: true, loaded: false }
  })),

  on(TrendingActions.loadTrendingCratesSuccess, (state, { response }) => ({
    ...state,
    trendingCrates: { 
      loading: false, 
      loaded: true,
      value: response.data,
      error: undefined 
    }
  })),

  on(TrendingActions.loadTrendingCratesFailure, (state, { error }) => ({
    ...state,
    trendingCrates: { 
      loading: false, 
      loaded: false,
      error,
      value: undefined 
    }
  })),

  // Recent crates
  on(TrendingActions.loadRecentCrates, (state) => ({
    ...state,
    recentCrates: { loading: true, loaded: false }
  })),

  on(TrendingActions.loadRecentCratesSuccess, (state, { response }) => ({
    ...state,
    recentCrates: { 
      loading: false, 
      loaded: true,
      value: response.data,
      error: undefined 
    }
  })),

  on(TrendingActions.loadRecentCratesFailure, (state, { error }) => ({
    ...state,
    recentCrates: { 
      loading: false, 
      loaded: false,
      error,
      value: undefined 
    }
  })),

  // Clear
  on(TrendingActions.clearTrendingCrates, () => initialState)
);