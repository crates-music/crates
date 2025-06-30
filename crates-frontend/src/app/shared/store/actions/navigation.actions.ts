import { createAction, props } from '@ngrx/store';

export type NavigationContext = 'discover' | 'profile' | 'crates' | 'library' | 'activity';

// Navigation Context Actions
export const setNavigationContext = createAction(
  '[Navigation] Set Context',
  props<{ context: NavigationContext }>()
);

export const setNavigationContextWithSource = createAction(
  '[Navigation] Set Context With Source',
  props<{ context: NavigationContext; source?: string; userId?: number }>()
);

// Clear Navigation Context
export const clearNavigationContext = createAction('[Navigation] Clear Context');

// Track User Navigation (for determining context when viewing other users' content)
export const trackUserNavigation = createAction(
  '[Navigation] Track User Navigation',
  props<{ userId: number; fromContext: NavigationContext }>()
);

// Track Crate Navigation (for determining context when viewing crates)
export const trackCrateNavigation = createAction(
  '[Navigation] Track Crate Navigation',
  props<{ crateId: number; fromContext: NavigationContext; isOwnCrate: boolean }>()
);

// Discover Tab Interactions
export const focusDiscoverSearch = createAction('[Navigation] Focus Discover Search');