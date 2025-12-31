import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil, tap, of, map } from 'rxjs';
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
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AutoCategorizeModal } from '../shared/modal/auto-categorize/auto-categorize.modal';

@Component({
  selector: 'crate-crate-list',
  templateUrl: './crate-list.component.html',
  styleUrls: ['./crate-list.component.scss']
})
export class CrateListComponent implements OnDestroy {
  // TEMPORARY: Set to true to see empty state
  SHOW_EMPTY_STATE = true;

  page: Pageable;
  crates$: Observable<Crate[]>;
  cratesLoading$: Observable<boolean>;
  hasNextPage$: Observable<boolean>;
  search$: Observable<string | undefined>;
  destroy$ = new Subject<boolean>();

  ListType = ListType;
  cratesListType: ListType;
  search: string;

  constructor(private router: Router,
              private store: Store,
              private modal: NgbModal) {
    // Set navigation context to 'crates' since this is the user's own crates list
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'crates' }));

    this.loadCrates();

    // TEMPORARY: Override to show empty state
    this.crates$ = this.SHOW_EMPTY_STATE
      ? of([])
      : this.store.select(selectAllCrates);
    this.cratesLoading$ = this.SHOW_EMPTY_STATE
      ? of(false)
      : this.store.select(selectCratesLoading);
    this.hasNextPage$ = this.store.select(selectCratesHasNextPage);
    this.search$ = this.store.select(selectCratesSearch);

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
    this.store.dispatch(NavigationActions.trackCrateNavigation({
      crateId: crate.id,
      fromContext: 'crates',
      isOwnCrate: true
    }));
    this.router.navigate(['/crate', crate.id]);
  }

  handleSearch($event: string) {
    this.search = $event;
    this.reloadCrates($event);
  }

  toggleCratesListType(listType: ListType) {
    this.store.dispatch(toggleCratesListType({ listType }));
  }

  trackByCrateId(index: number, crate: Crate): string {
    return String(crate.id);
  }

  openAutoCategorizeModal() {
    const modalRef = this.modal.open(AutoCategorizeModal, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.closed.subscribe(() => {
      // Modal closed successfully (crates created)
      // Crates are already reloaded by the effect, no need to do it again
    });

    modalRef.dismissed.subscribe(() => {
      // Modal was cancelled or dismissed
    });
  }
}
