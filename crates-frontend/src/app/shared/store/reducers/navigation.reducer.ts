import { createReducer, on } from '@ngrx/store';
import * as NavigationActions from '../actions/navigation.actions';
import { NavigationContext } from '../actions/navigation.actions';

export interface NavigationState {
  currentContext: NavigationContext | null;
  previousContext: NavigationContext | null;
  navigationHistory: {
    userId?: number;
    crateId?: number;
    fromContext: NavigationContext;
    timestamp: number;
  }[];
}

export const initialState: NavigationState = {
  currentContext: null,
  previousContext: null,
  navigationHistory: []
};

export const navigationReducer = createReducer(
  initialState,
  on(NavigationActions.setNavigationContext, (state, { context }) => ({
    ...state,
    previousContext: state.currentContext,
    currentContext: context
  })),
  on(NavigationActions.setNavigationContextWithSource, (state, { context, source, userId }) => ({
    ...state,
    previousContext: state.currentContext,
    currentContext: context,
    navigationHistory: [
      ...state.navigationHistory.slice(-10), // Keep last 10 entries
      {
        userId,
        fromContext: context,
        timestamp: Date.now()
      }
    ]
  })),
  on(NavigationActions.clearNavigationContext, (state) => ({
    ...state,
    currentContext: null,
    previousContext: null
  })),
  on(NavigationActions.trackUserNavigation, (state, { userId, fromContext }) => ({
    ...state,
    navigationHistory: [
      ...state.navigationHistory.slice(-10), // Keep last 10 entries
      {
        userId,
        fromContext,
        timestamp: Date.now()
      }
    ]
  })),
  on(NavigationActions.trackCrateNavigation, (state, { crateId, fromContext, isOwnCrate }) => ({
    ...state,
    navigationHistory: [
      ...state.navigationHistory.slice(-10), // Keep last 10 entries
      {
        crateId,
        fromContext,
        timestamp: Date.now()
      }
    ]
  }))
);