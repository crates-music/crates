import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil, tap, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { State } from '../../store/reducers';
import { selectCurrentNavigationContext } from '../../shared/store/selectors/navigation.selectors';
import { NavigationContext } from '../../shared/store/actions/navigation.actions';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';

export enum Tab {
  Crates = 'CRATES',
  Library = 'LIBRARY',
  Activity = 'ACTIVITY',
  Discover = 'DISCOVER',
  Profile = 'PROFILE'
}

@Component({
  selector: 'crates-mobile-footer',
  templateUrl: './mobile-footer.component.html',
  styleUrls: ['./mobile-footer.component.scss']
})
export class MobileFooterComponent implements OnDestroy {
  currentTab: Tab;
  Tab = Tab;

  destroy$ = new Subject<boolean>();
  currentNavigationContext$: Observable<NavigationContext | null>;

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              private store: Store<State>) {
    this.currentNavigationContext$ = this.store.select(selectCurrentNavigationContext);
    
    // Subscribe to navigation context changes
    this.currentNavigationContext$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(context => {
      this.updateCurrentTabFromContext(context);
    });

    // Fallback to URL parsing if no context is set (for direct navigation)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      tap(() => this.updateCurrentTabFromUrl()),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private updateCurrentTabFromContext(context: NavigationContext | null): void {
    if (!context) {
      return; // Let URL parsing handle it
    }

    switch (context) {
      case 'crates':
        this.currentTab = Tab.Crates;
        break;
      case 'library':
        this.currentTab = Tab.Library;
        break;
      case 'activity':
        this.currentTab = Tab.Activity;
        break;
      case 'discover':
        this.currentTab = Tab.Discover;
        break;
      case 'profile':
        this.currentTab = Tab.Profile;
        break;
      default:
        // Fallback to URL parsing if unknown context
        this.updateCurrentTabFromUrl();
    }
  }

  private updateCurrentTabFromUrl(): void {
    // Only update from URL if no navigation context is set
    this.currentNavigationContext$.pipe(takeUntil(this.destroy$)).subscribe(context => {
      if (context) {
        return; // Context takes precedence
      }

      const segments = this.router.routerState.snapshot.url.split('/');
      console.log('Fallback URL parsing:', segments);
      
      if (segments.includes('crate')) {
        this.currentTab = Tab.Crates;
      } else if (segments.includes('library')) {
        this.currentTab = Tab.Library;
      } else if (segments.includes('activity')) {
        this.currentTab = Tab.Activity;
      } else if (segments.includes('discover')) {
        this.currentTab = Tab.Discover;
      } else if (segments.includes('user')) {
        this.currentTab = Tab.Profile;
      } else if (segments.includes('auth')) {
        this.currentTab = undefined;
      }
    });
  }

  onDiscoverTabClick(): void {
    // Check if we're already on the discover page
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/discover') && this.currentTab === Tab.Discover) {
      // Already on discover page - trigger focus and clear action
      this.store.dispatch(NavigationActions.focusDiscoverSearch());
    } else {
      // Navigate to discover page
      this.router.navigate(['/discover']);
    }
  }
}
