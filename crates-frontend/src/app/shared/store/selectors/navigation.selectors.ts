import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NavigationState } from '../reducers/navigation.reducer';

export const selectNavigationState = createFeatureSelector<NavigationState>('navigation');

export const selectCurrentNavigationContext = createSelector(
  selectNavigationState,
  (state: NavigationState) => state.currentContext
);

export const selectPreviousNavigationContext = createSelector(
  selectNavigationState,
  (state: NavigationState) => state.previousContext
);

export const selectNavigationHistory = createSelector(
  selectNavigationState,
  (state: NavigationState) => state.navigationHistory
);

// Helper selector to determine if we're in a "discover" context
export const selectIsDiscoverContext = createSelector(
  selectCurrentNavigationContext,
  (context) => context === 'discover'
);

// Helper selector to get the most recent navigation entry for a specific user
export const selectLastNavigationForUser = (userId: number) => createSelector(
  selectNavigationHistory,
  (history) => history
    .filter(entry => entry.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)[0]
);

// Helper selector to determine context for viewing another user's content
export const selectContextForUser = (userId: number, currentUserId: number) => createSelector(
  selectCurrentNavigationContext,
  selectLastNavigationForUser(userId),
  (currentContext, lastNavigation) => {
    // If viewing own content, use appropriate personal context
    if (userId === currentUserId) {
      return currentContext;
    }
    
    // If we have a recent navigation entry for this user, use that context
    if (lastNavigation && (Date.now() - lastNavigation.timestamp) < 300000) { // 5 minutes
      return lastNavigation.fromContext;
    }
    
    // Default to current context, or 'discover' if no context set
    return currentContext || 'discover';
  }
);