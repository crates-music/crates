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
import * as NavigationActions from '../shared/store/actions/navigation.actions';
import { selectSearchQuery, selectSearchResults, selectSearchLoading, selectSearchUsers, selectSearchCrates } from '../shared/store/selectors/search.selectors';
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
  }

  ngOnInit() {
    // Set navigation context to 'discover'
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'discover' }));

    // Restore search query from store if it exists
    this.store.select(selectSearchQuery).pipe(
      takeUntil(this.destroy$)
    ).subscribe(storedQuery => {
      if (storedQuery && storedQuery.trim().length > 0 && storedQuery !== this.searchControl.value) {
        // Set the search control value without triggering valueChanges (results are already in store)
        this.searchControl.setValue(storedQuery, { emitEvent: false });
      }
    });

    // Setup debounced search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query && query.trim().length > 0) {
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
    this.store.dispatch(SearchActions.clearSearch());
    
    // Focus the search input
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }
}