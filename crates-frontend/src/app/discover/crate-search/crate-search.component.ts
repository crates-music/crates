import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs';
import { Crate } from '../../crate/shared/model/crate.model';
import { Page } from '../../shared/model/page.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../shared/model/pageable.model';
import { DiscoverService } from '../../shared/services/discover.service';

@Component({
  selector: 'app-crate-search',
  templateUrl: './crate-search.component.html',
  styleUrls: ['./crate-search.component.scss']
})
export class CrateSearchComponent implements OnDestroy {
  crates: Crate[] = [];
  loading = false;
  searchTerm = '';
  hasNextPage = false;
  page: Pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
  
  private destroy$ = new Subject<boolean>();
  private searchSubject = new Subject<string>();

  constructor(private discoverService: DiscoverService) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''), // Start with empty search to show all public crates
      takeUntil(this.destroy$),
      switchMap(searchTerm => {
        this.loading = true;
        this.page.pageNumber = 0; // Reset to first page on new search
        return this.discoverService.discoverCrates(this.page, searchTerm || undefined);
      })
    ).subscribe({
      next: (result) => {
        this.crates = result.content;
        this.hasNextPage = !result.last;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching crates:', error);
        this.loading = false;
      }
    });
    
    // Trigger initial load
    this.searchSubject.next('');
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  loadMore() {
    if (this.loading || !this.hasNextPage) {
      return;
    }

    this.loading = true;
    this.page.pageNumber++;
    
    this.discoverService.discoverCrates(this.page, this.searchTerm || undefined).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.crates = [...this.crates, ...result.content];
        this.hasNextPage = !result.last;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading more crates:', error);
        this.loading = false;
        this.page.pageNumber--; // Revert page number on error
      }
    });
  }

  trackByCrateId(index: number, crate: Crate): number {
    return crate.id;
  }
}