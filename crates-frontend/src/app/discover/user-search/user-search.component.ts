import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { User } from '../../user/shared/model/user.model';
import { Page } from '../../shared/model/page.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../shared/model/pageable.model';
import { DiscoverService } from '../../shared/services/discover.service';

@Component({
  selector: 'app-user-search',
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements OnDestroy {
  users: User[] = [];
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
      takeUntil(this.destroy$),
      switchMap(searchTerm => {
        if (searchTerm.trim().length < 2) {
          return of({ content: [], last: true } as Page<User>);
        }
        this.loading = true;
        this.page.pageNumber = 0; // Reset to first page on new search
        return this.discoverService.searchUsers(searchTerm, this.page);
      })
    ).subscribe({
      next: (result) => {
        this.users = result.content;
        this.hasNextPage = !result.last;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.loading = false;
      }
    });
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
    if (this.loading || !this.hasNextPage || this.searchTerm.trim().length < 2) {
      return;
    }

    this.loading = true;
    this.page.pageNumber++;
    
    this.discoverService.searchUsers(this.searchTerm, this.page).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.users = [...this.users, ...result.content];
        this.hasNextPage = !result.last;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading more users:', error);
        this.loading = false;
        this.page.pageNumber--; // Revert page number on error
      }
    });
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}