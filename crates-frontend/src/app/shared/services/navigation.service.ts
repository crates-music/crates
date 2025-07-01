import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil, Observable, BehaviorSubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { State } from '../../store/reducers';
import { selectCurrentNavigationContext } from '../store/selectors/navigation.selectors';
import { NavigationContext } from '../store/actions/navigation.actions';
import * as NavigationActions from '../store/actions/navigation.actions';

export enum Tab {
  Crates = 'CRATES',
  Library = 'LIBRARY',
  Activity = 'ACTIVITY',
  Discover = 'DISCOVER',
  Profile = 'PROFILE'
}

export interface TabConfig {
  id: Tab;
  label: string;
  route: string;
  icon: string;
  context: NavigationContext;
  showOnMobile: boolean;
  showOnDesktop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService implements OnDestroy {
  
  private destroy$ = new Subject<boolean>();
  private currentTab$ = new BehaviorSubject<Tab | undefined>(undefined);
  
  currentNavigationContext$: Observable<NavigationContext | null>;
  
  // Tab configuration - single source of truth
  readonly tabs: TabConfig[] = [
    {
      id: Tab.Crates,
      label: 'Crates',
      route: '/crate/list',
      icon: 'bi-box-seam',
      context: 'crates',
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      id: Tab.Library,
      label: 'Library',
      route: '/library',
      icon: 'bi-disc',
      context: 'library',
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      id: Tab.Activity,
      label: 'Activity',
      route: '/activity',
      icon: 'bi-activity',
      context: 'activity',
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      id: Tab.Discover,
      label: 'Discover',
      route: '/discover',
      icon: 'bi-compass',
      context: 'discover',
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      id: Tab.Profile,
      label: 'Profile',
      route: '/user/profile/settings',
      icon: 'bi-person',
      context: 'profile',
      showOnMobile: true,
      showOnDesktop: false // Profile handled differently on desktop
    }
  ];

  constructor(
    private router: Router,
    private store: Store<State>
  ) {
    this.currentNavigationContext$ = this.store.select(selectCurrentNavigationContext);
    
    // Initialize tab tracking
    this.initializeTabTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  /**
   * Get current tab as observable
   */
  getCurrentTab$(): Observable<Tab | undefined> {
    return this.currentTab$.asObservable();
  }

  /**
   * Get current tab synchronously
   */
  getCurrentTab(): Tab | undefined {
    return this.currentTab$.value;
  }

  /**
   * Navigate to a specific tab
   */
  navigateToTab(tab: Tab): void {
    const tabConfig = this.getTabConfig(tab);
    if (tabConfig) {
      if (tab === Tab.Discover) {
        this.handleDiscoverNavigation(tabConfig.route);
      } else {
        this.router.navigate([tabConfig.route]);
      }
    }
  }

  /**
   * Handle special Discover tab navigation (focus or navigate)
   */
  handleDiscoverNavigation(route: string): void {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/discover') && this.getCurrentTab() === Tab.Discover) {
      // Already on discover page - trigger focus and clear action
      this.store.dispatch(NavigationActions.focusDiscoverSearch());
    } else {
      // Navigate to discover page
      this.router.navigate([route]);
    }
  }

  /**
   * Check if a route is currently active
   */
  isRouteActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  /**
   * Check if a tab is currently active
   */
  isTabActive(tab: Tab): boolean {
    return this.getCurrentTab() === tab;
  }

  /**
   * Get tab configuration by tab ID
   */
  getTabConfig(tab: Tab): TabConfig | undefined {
    return this.tabs.find(t => t.id === tab);
  }

  /**
   * Get tabs filtered by platform (mobile/desktop)
   */
  getTabsForMobile(): TabConfig[] {
    return this.tabs.filter(tab => tab.showOnMobile);
  }

  getTabsForDesktop(): TabConfig[] {
    return this.tabs.filter(tab => tab.showOnDesktop);
  }

  /**
   * Initialize tab tracking based on context and URL changes
   */
  private initializeTabTracking(): void {
    // Subscribe to navigation context changes
    this.currentNavigationContext$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(context => {
      this.updateCurrentTabFromContext(context);
    });

    // Fallback to URL parsing if no context is set (for direct navigation)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateCurrentTabFromUrl();
    });
  }

  /**
   * Update current tab based on navigation context
   */
  private updateCurrentTabFromContext(context: NavigationContext | null): void {
    if (!context) {
      return; // Let URL parsing handle it
    }

    const tabConfig = this.tabs.find(tab => tab.context === context);
    if (tabConfig) {
      this.currentTab$.next(tabConfig.id);
    } else {
      // Fallback to URL parsing if unknown context
      this.updateCurrentTabFromUrl();
    }
  }

  /**
   * Update current tab based on current URL (fallback method)
   */
  private updateCurrentTabFromUrl(): void {
    // Only update from URL if no navigation context is set
    this.currentNavigationContext$.pipe(takeUntil(this.destroy$)).subscribe(context => {
      if (context) {
        return; // Context takes precedence
      }

      const segments = this.router.routerState.snapshot.url.split('/');
      const url = this.router.routerState.snapshot.url;
      
      if (segments.includes('crate')) {
        this.currentTab$.next(Tab.Crates);
      } else if (segments.includes('library')) {
        this.currentTab$.next(Tab.Library);
      } else if (segments.includes('activity')) {
        this.currentTab$.next(Tab.Activity);
      } else if (segments.includes('discover')) {
        this.currentTab$.next(Tab.Discover);
      } else if (url.includes('/user/profile/settings')) {
        this.currentTab$.next(Tab.Profile);
      } else if (segments.includes('user')) {
        // For other user routes (viewing other users), don't set any tab
        this.currentTab$.next(undefined);
      } else if (segments.includes('auth')) {
        this.currentTab$.next(undefined);
      }
    });
  }
}