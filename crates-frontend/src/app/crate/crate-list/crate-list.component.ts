import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil, tap, combineLatest, map, startWith } from 'rxjs';
import { Crate } from '../shared/model/crate.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../shared/model/pageable.model';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectAllCrates,
  selectCratesHasNextPage,
  selectCratesListType,
  selectCratesLoading,
  selectCratesSearch
} from '../store/selectors/crate.selectors';
import { loadCrates, toggleCratesListType, reloadCrates } from '../store/actions/load-crates.actions';
import { ListType } from '../../shared/model/list-type.model';
import { CollectionService } from '../../shared/services/collection.service';
import { UserService } from '../../user/shared/service/user.service';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import {
  selectMyCollectionCrates,
  selectMyCollectionLoading,
  selectMyCollectionLoaded,
  selectMyCollectionHasNextPage
} from '../../shared/store/selectors/collection.selectors';
import * as CollectionActions from '../../shared/store/actions/collection.actions';

@Component({
  selector: 'crate-crate-list',
  templateUrl: './crate-list.component.html',
  styleUrls: ['./crate-list.component.scss']
})
export class CrateListComponent implements OnDestroy {
  page: Pageable;
  crates$: Observable<Crate[]>;
  cratesLoading$: Observable<boolean>;
  hasNextPage$: Observable<boolean>;
  search$: Observable<string | undefined>;
  destroy$ = new Subject<boolean>();

  // Collection data
  collectionCrates$: Observable<Crate[]>;
  collectionLoading$: Observable<boolean>;
  collectionLoaded$: Observable<boolean>;
  collectionHasNextPage$: Observable<boolean>;
  collectionPage: Pageable;

  // Current user
  currentUser$ = this.userService.getUser();

  ListType = ListType;
  cratesListType: ListType;
  search: string;
  activeTab: 'owned' | 'collection' = 'owned';

  constructor(private router: Router,
              private store: Store,
              private collectionService: CollectionService,
              private userService: UserService) {
    // Set navigation context to 'crates' since this is the user's own crates list
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'crates' }));
    
    this.loadCrates();
    this.loadCollection();

    this.crates$ = this.store.select(selectAllCrates);
    this.cratesLoading$ = this.store.select(selectCratesLoading);
    this.hasNextPage$ = this.store.select(selectCratesHasNextPage);
    this.search$ = this.store.select(selectCratesSearch);
    
    // Collection selectors
    this.collectionCrates$ = this.store.select(selectMyCollectionCrates);
    this.collectionLoading$ = this.store.select(selectMyCollectionLoading);
    this.collectionLoaded$ = this.store.select(selectMyCollectionLoaded);
    this.collectionHasNextPage$ = this.store.select(selectMyCollectionHasNextPage);

    this.store.select(selectCratesListType).pipe(
      tap(listType => this.cratesListType = listType),
      takeUntil(this.destroy$),
    ).subscribe();

  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadCrates(search?: string): void {
    this.page = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(loadCrates({ pageable: this.page, search }));
  }

  private loadCollection(search?: string): void {
    this.collectionPage = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(CollectionActions.loadMyCollection({ pageable: this.collectionPage, search }));
  }

  private reloadCrates(search?: string): void {
    this.page = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(reloadCrates({ pageable: this.page, search }));
  }

  loadMore() {
    this.page = this.page.nextPageable();
    this.store.dispatch(loadCrates({ pageable: this.page }));
  }

  openCrate(crate: Crate) {
    // Track that we're navigating to this crate from 'crates' context
    const isOwnCrate = this.activeTab === 'owned';
    this.store.dispatch(NavigationActions.trackCrateNavigation({ 
      crateId: crate.id, 
      fromContext: 'crates', 
      isOwnCrate 
    }));
    this.router.navigate(['/crate', crate.id]);
  }

  handleSearch($event: string) {
    this.search = $event;
    if (this.activeTab === 'owned') {
      this.reloadCrates($event);
    } else {
      this.loadCollection($event);
    }
  }

  toggleCratesListType(listType: ListType) {
    this.store.dispatch(toggleCratesListType({ listType }));
  }

  setActiveTab(tab: 'owned' | 'collection') {
    this.activeTab = tab;
    if (tab === 'collection') {
      this.loadCollection(this.search);
    }
  }

  loadMoreCollection() {
    // TODO: Implement load more for collection
    // This would require updating the reducer to handle appending to existing data
    this.collectionPage = this.collectionPage.nextPageable();
    this.store.dispatch(CollectionActions.loadMyCollection({ pageable: this.collectionPage, search: this.search }));
  }

  getCurrentCrates$(): Observable<Crate[]> {
    return this.activeTab === 'owned' ? this.crates$ : this.collectionCrates$;
  }

  getCurrentLoading$(): Observable<boolean> {
    return this.activeTab === 'owned' ? this.cratesLoading$ : this.collectionLoading$;
  }

  getCurrentHasNextPage$(): Observable<boolean> {
    return this.activeTab === 'owned' ? this.hasNextPage$ : this.collectionHasNextPage$;
  }

  isOwnedCrate(crate: Crate): boolean {
    // This would ideally compare with current user ID from state
    // For now, we'll assume if we're in the owned tab, it's owned
    return this.activeTab === 'owned';
  }

  trackByCrateId(index: number, crate: Crate): string {
    return String(crate.id);
  }
}
