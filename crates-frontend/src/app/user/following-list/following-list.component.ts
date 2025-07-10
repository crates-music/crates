import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Location } from '@angular/common';
import { UserFollow } from '../../shared/model/user-follow.model';
import { Page } from '../../shared/model/page.model';
import { Pageable } from '../../shared/model/pageable.model';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import * as SocialActions from '../../shared/store/actions/social.actions';
import { selectFollowing, selectFollowingLoading, selectSocialError } from '../../shared/store/selectors/social.selectors';

@Component({
  selector: 'app-following-list',
  templateUrl: './following-list.component.html',
  styleUrls: ['./following-list.component.scss']
})
export class FollowingListComponent implements OnInit, OnDestroy {
  following: UserFollow[] = [];
  isLoading$: Observable<boolean>;
  error$: Observable<any>;
  hasMore = true;
  currentPageable: Pageable = Pageable.of(0, 20);
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private location: Location
  ) {
    this.isLoading$ = this.store.select(selectFollowingLoading);
    this.error$ = this.store.select(selectSocialError);
  }

  ngOnInit(): void {
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'profile' }));
    this.loadFollowing();
    
    // Subscribe to following data from store
    this.store.select(selectFollowing)
      .pipe(takeUntil(this.destroy$))
      .subscribe(followingPage => {
        if (followingPage) {
          if (this.currentPageable.pageNumber === 0) {
            // Initial load or refresh
            this.following = followingPage.content;
          } else {
            // Load more - append to existing data
            this.following = [...this.following, ...followingPage.content];
          }
          this.hasMore = !followingPage.last;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFollowing(loadMore = false): void {
    if (!loadMore) {
      this.currentPageable = Pageable.of(0, 20);
      this.following = [];
    }

    this.store.dispatch(SocialActions.loadFollowing({ pageable: this.currentPageable }));
  }

  onLoadMore(): void {
    this.currentPageable = this.currentPageable.nextPageable();
    this.loadFollowing(true);
  }

  onBackClick(): void {
    this.location.back();
  }

  getUserDisplayName(user: any): string {
    return user.handle || user.spotifyId || 'Unknown User';
  }

  getUserProfileLink(user: any): string {
    return `/user/${user.id}`;
  }

  onFollowChange(userId: number, isNowFollowing: boolean): void {
    // If the user was unfollowed, remove them from the following list
    if (!isNowFollowing) {
      this.following = this.following.filter(follow => follow.following.id !== userId);
    }
  }
}