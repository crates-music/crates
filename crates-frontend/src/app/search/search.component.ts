import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DEFAULT_PAGE_SIZE, Pageable } from '../shared/model/pageable.model';
import { UnifiedSearchResponse } from '../shared/model/unified-search.model';
import { User } from '../user/shared/model/user.model';
import { Crate } from '../crate/shared/model/crate.model';
import * as SearchActions from '../shared/store/actions/search.actions';
import { selectSearchQuery, selectSearchResults, selectSearchLoading, selectSearchUsers, selectSearchCrates } from '../shared/store/selectors/search.selectors';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  destroy$ = new Subject<boolean>();

  query$: Observable<string>;
  results$: Observable<UnifiedSearchResponse | null>;
  loading$: Observable<boolean>;
  users$: Observable<User[]>;
  crates$: Observable<Crate[]>;

  constructor(
    private store: Store,
    private router: Router
  ) {
    this.query$ = this.store.select(selectSearchQuery);
    this.results$ = this.store.select(selectSearchResults);
    this.loading$ = this.store.select(selectSearchLoading);
    this.users$ = this.store.select(selectSearchUsers);
    this.crates$ = this.store.select(selectSearchCrates);
  }

  ngOnInit() {
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
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private performSearch(query: string) {
    const pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(SearchActions.search({ query, pageable }));
  }

  goBack() {
    this.router.navigate(['/crate/list']);
  }

  openUser(user: User) {
    this.router.navigate(['/user', user.handle]);
  }

  openCrate(crate: Crate) {
    this.router.navigate(['/crate', crate.id]);
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByCrateId(index: number, crate: Crate): number {
    return crate.id;
  }
}