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
  collectionLoading$ = new Subject<boolean>();
  collectionHasNextPage = false;
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
    this.loadCrates();
    this.loadCollection();

    this.crates$ = this.store.select(selectAllCrates);
    this.cratesLoading$ = this.store.select(selectCratesLoading);
    this.hasNextPage$ = this.store.select(selectCratesHasNextPage);
    this.search$ = this.store.select(selectCratesSearch);

    this.store.select(selectCratesListType).pipe(
      tap(listType => this.cratesListType = listType),
      takeUntil(this.destroy$),
    ).subscribe();

    // Load collection crates
    this.collectionCrates$ = this.collectionService.getMyCollection(
      Pageable.of(0, DEFAULT_PAGE_SIZE)
    ).pipe(
      map(page => {
        this.collectionHasNextPage = !page.last;
        return page.content;
      }),
      startWith([])
    );
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
    this.collectionLoading$.next(true);
    
    this.collectionCrates$ = this.collectionService.getMyCollection(this.collectionPage, search).pipe(
      map(page => {
        this.collectionHasNextPage = !page.last;
        this.collectionLoading$.next(false);
        return page.content;
      }),
      takeUntil(this.destroy$)
    );
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
    if (tab === 'collection' && this.search) {
      this.loadCollection(this.search);
    }
  }

  loadMoreCollection() {
    if (this.collectionHasNextPage) {
      this.collectionPage = this.collectionPage.nextPageable();
      this.collectionLoading$.next(true);
      
      this.collectionService.getMyCollection(this.collectionPage, this.search).pipe(
        takeUntil(this.destroy$)
      ).subscribe(page => {
        // This is simplified - in a real app you'd merge with existing results
        this.collectionHasNextPage = !page.last;
        this.collectionLoading$.next(false);
      });
    }
  }

  getCurrentCrates$(): Observable<Crate[]> {
    return this.activeTab === 'owned' ? this.crates$ : this.collectionCrates$;
  }

  getCurrentLoading$(): Observable<boolean> {
    return this.activeTab === 'owned' ? this.cratesLoading$ : this.collectionLoading$;
  }

  getCurrentHasNextPage$(): Observable<boolean> {
    return this.activeTab === 'owned' ? this.hasNextPage$ : this.collectionLoading$.pipe(map(() => this.collectionHasNextPage));
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
