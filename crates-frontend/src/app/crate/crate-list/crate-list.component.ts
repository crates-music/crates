import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { Crate } from '../shared/model/crate.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../shared/model/pageable.model';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectAllCrates,
  selectCratesHasNextPage,
  selectCratesListType,
  selectCratesLoading
} from '../store/selectors/crate.selectors';
import { loadCrates, toggleCratesListType, reloadCrates } from '../store/actions/load-crates.actions';
import { ListType } from '../../shared/model/list-type.model';

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
  destroy$ = new Subject<boolean>();

  ListType = ListType;
  cratesListType: ListType;
  search: string;

  constructor(private router: Router,
              private store: Store) {
    this.loadCrates();

    this.crates$ = this.store.select(selectAllCrates);
    this.cratesLoading$ = this.store.select(selectCratesLoading);
    this.hasNextPage$ = this.store.select(selectCratesHasNextPage);

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
    this.router.navigate(['/crate', crate.id]);
  }

  handleSearch($event: string) {
    this.reloadCrates($event);
  }

  toggleCratesListType(listType: ListType) {
    this.store.dispatch(toggleCratesListType({ listType }));
  }

  trackByCrateId(index: number, crate: Crate): string {
    return String(crate.id);
  }
}
