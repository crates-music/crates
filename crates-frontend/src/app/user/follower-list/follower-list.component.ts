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
import { selectFollowers, selectFollowersLoading, selectSocialError } from '../../shared/store/selectors/social.selectors';

@Component({
  selector: 'app-follower-list',
  templateUrl: './follower-list.component.html',
  styleUrls: ['./follower-list.component.scss']
})
export class FollowerListComponent implements OnInit, OnDestroy {
  followers: UserFollow[] = [];
  isLoading$: Observable<boolean>;
  error$: Observable<any>;
  hasMore = true;
  currentPageable: Pageable = Pageable.of(0, 20);
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private location: Location
  ) {
    this.isLoading$ = this.store.select(selectFollowersLoading);
    this.error$ = this.store.select(selectSocialError);
  }

  ngOnInit(): void {
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'profile' }));
    this.loadFollowers();
    
    // Subscribe to followers data from store
    this.store.select(selectFollowers)
      .pipe(takeUntil(this.destroy$))
      .subscribe(followersPage => {
        if (followersPage) {
          if (this.currentPageable.pageNumber === 0) {
            // Initial load or refresh
            this.followers = followersPage.content;
          } else {
            // Load more - append to existing data
            this.followers = [...this.followers, ...followersPage.content];
          }
          this.hasMore = !followersPage.last;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFollowers(loadMore = false): void {
    if (!loadMore) {
      this.currentPageable = Pageable.of(0, 20);
      this.followers = [];
    }

    this.store.dispatch(SocialActions.loadFollowers({ pageable: this.currentPageable }));
  }

  onLoadMore(): void {
    this.currentPageable = this.currentPageable.nextPageable();
    this.loadFollowers(true);
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
    // If the user was unfollowed, remove them from the followers list
    // This happens when the current user unfollows someone who was following them
    if (!isNowFollowing) {
      this.followers = this.followers.filter(follow => follow.follower.id !== userId);
    }
  }
}