import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DEFAULT_PAGE_SIZE, Pageable } from '../shared/model/pageable.model';
import { UnifiedSearchResponse } from '../shared/model/unified-search.model';
import { User } from '../user/shared/model/user.model';
import { Crate } from '../crate/shared/model/crate.model';
import * as SearchActions from '../shared/store/actions/search.actions';
import * as TrendingActions from '../shared/store/actions/trending.actions';
import * as NavigationActions from '../shared/store/actions/navigation.actions';
import { selectSearchQuery, selectSearchResults, selectSearchLoading, selectSearchUsers, selectSearchCrates } from '../shared/store/selectors/search.selectors';
import { selectTrendingCrates, selectTrendingCratesLoading, selectRecentCrates, selectRecentCratesLoading } from '../shared/store/selectors/trending.selectors';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  searchControl = new FormControl('');
  destroy$ = new Subject<boolean>();

  query$: Observable<string>;
  results$: Observable<UnifiedSearchResponse | null>;
  loading$: Observable<boolean>;
  users$: Observable<User[]>;
  crates$: Observable<Crate[]>;
  
  // Trending data
  trendingCrates$: Observable<Crate[]>;
  trendingLoading$: Observable<boolean>;
  recentCrates$: Observable<Crate[]>;
  recentLoading$: Observable<boolean>;
  selectedTab: 'trending' | 'recent' = 'trending';
  
  // Search state
  isSearchActive: boolean = false;

  constructor(
    private store: Store,
    private router: Router,
    private actions$: Actions
  ) {
    this.query$ = this.store.select(selectSearchQuery);
    this.results$ = this.store.select(selectSearchResults);
    this.loading$ = this.store.select(selectSearchLoading);
    this.users$ = this.store.select(selectSearchUsers);
    this.crates$ = this.store.select(selectSearchCrates);
    
    // Trending selectors
    this.trendingCrates$ = this.store.select(selectTrendingCrates);
    this.trendingLoading$ = this.store.select(selectTrendingCratesLoading);
    this.recentCrates$ = this.store.select(selectRecentCrates);
    this.recentLoading$ = this.store.select(selectRecentCratesLoading);
  }

  ngOnInit() {
    // Set navigation context to 'discover'
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'discover' }));

    // Load trending crates on init
    this.loadTrendingCrates();

    // Restore search query from store if it exists
    this.store.select(selectSearchQuery).pipe(
      takeUntil(this.destroy$)
    ).subscribe(storedQuery => {
      if (storedQuery && storedQuery.trim().length > 0 && storedQuery !== this.searchControl.value) {
        // Set the search control value without triggering valueChanges (results are already in store)
        this.searchControl.setValue(storedQuery, { emitEvent: false });
        this.isSearchActive = true;
      }
    });

    // Setup debounced search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      const hasQuery = query && query.trim().length > 0;
      this.isSearchActive = hasQuery;
      
      if (hasQuery) {
        this.performSearch(query.trim());
      } else {
        this.store.dispatch(SearchActions.clearSearch());
      }
    });

    // Listen for focus discover search action
    this.actions$.pipe(
      ofType(NavigationActions.focusDiscoverSearch),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.clearAndFocusSearch();
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private performSearch(query: string) {
    const pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(SearchActions.search({ query, pageable }));
  }

  openUser(user: User) {
    // Track that we're navigating to this user from discover context
    this.store.dispatch(NavigationActions.trackUserNavigation({ 
      userId: user.id, 
      fromContext: 'discover' 
    }));
    this.router.navigate(['/user', user.id]);
  }

  openCrate(crate: Crate) {
    // Record the view for analytics
    this.store.dispatch(TrendingActions.recordCrateView({ crateId: crate.id }));
    
    // Track that we're navigating to this crate from discover context
    this.store.dispatch(NavigationActions.trackCrateNavigation({ 
      crateId: crate.id, 
      fromContext: 'discover', 
      isOwnCrate: false // From discover, it's always someone else's crate
    }));
    this.router.navigate(['/crate', crate.id]);
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByCrateId(index: number, crate: Crate): number {
    return crate.id;
  }

  private clearAndFocusSearch(): void {
    // Clear search control and store
    this.searchControl.setValue('', { emitEvent: false });
    this.isSearchActive = false;
    this.store.dispatch(SearchActions.clearSearch());
    
    // Focus the search input
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  private loadTrendingCrates(): void {
    const pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(TrendingActions.loadTrendingCrates({ pageable }));
  }

  switchTab(tab: 'trending' | 'recent'): void {
    this.selectedTab = tab;
    const pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
    
    if (tab === 'trending') {
      this.store.dispatch(TrendingActions.loadTrendingCrates({ pageable }));
    } else {
      this.store.dispatch(TrendingActions.loadRecentCrates({ pageable }));
    }
  }

  getCurrentCrates$(): Observable<Crate[]> {
    return this.selectedTab === 'trending' ? this.trendingCrates$ : this.recentCrates$;
  }

  getCurrentLoading$(): Observable<boolean> {
    return this.selectedTab === 'trending' ? this.trendingLoading$ : this.recentLoading$;
  }

}