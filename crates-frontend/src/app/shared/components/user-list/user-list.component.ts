import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Location } from '@angular/common';
import { UserFollow } from '../../model/user-follow.model';
import { Page } from '../../model/page.model';
import { Pageable } from '../../model/pageable.model';
import * as NavigationActions from '../../store/actions/navigation.actions';
import * as SocialActions from '../../store/actions/social.actions';
import { 
  selectFollowing, 
  selectFollowingLoading, 
  selectFollowers, 
  selectFollowersLoading, 
  selectSocialError 
} from '../../store/selectors/social.selectors';

export type UserListType = 'following' | 'followers';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  @Input() listType: UserListType = 'following';
  @Input() title: string = '';
  @Input() emptyStateIcon: string = 'bi-person-check';
  @Input() emptyStateTitle: string = '';
  @Input() emptyStateMessage: string = '';

  users: UserFollow[] = [];
  isLoading$: Observable<boolean>;
  error$: Observable<any>;
  hasMore = true;
  currentPageable: Pageable = Pageable.of(0, 20);
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private location: Location
  ) {
    this.error$ = this.store.select(selectSocialError);
  }

  ngOnInit(): void {
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'profile' }));
    
    // Set up observables based on list type
    if (this.listType === 'following') {
      this.isLoading$ = this.store.select(selectFollowingLoading);
      this.subscribeToFollowing();
    } else {
      this.isLoading$ = this.store.select(selectFollowersLoading);
      this.subscribeToFollowers();
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToFollowing(): void {
    this.store.select(selectFollowing)
      .pipe(takeUntil(this.destroy$))
      .subscribe(followingPage => {
        this.handleUserPageUpdate(followingPage);
      });
  }

  private subscribeToFollowers(): void {
    this.store.select(selectFollowers)
      .pipe(takeUntil(this.destroy$))
      .subscribe(followersPage => {
        this.handleUserPageUpdate(followersPage);
      });
  }

  private handleUserPageUpdate(userPage: Page<UserFollow> | null): void {
    if (userPage) {
      if (this.currentPageable.pageNumber === 0) {
        // Initial load or refresh
        this.users = userPage.content;
      } else {
        // Load more - append to existing data
        this.users = [...this.users, ...userPage.content];
      }
      this.hasMore = !userPage.last;
    }
  }

  loadUsers(loadMore = false): void {
    if (!loadMore) {
      this.currentPageable = Pageable.of(0, 20);
      this.users = [];
    }

    if (this.listType === 'following') {
      this.store.dispatch(SocialActions.loadFollowing({ pageable: this.currentPageable }));
    } else {
      this.store.dispatch(SocialActions.loadFollowers({ pageable: this.currentPageable }));
    }
  }

  onLoadMore(): void {
    this.currentPageable = this.currentPageable.nextPageable();
    this.loadUsers(true);
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

  getUser(follow: UserFollow): any {
    return this.listType === 'following' ? follow.following : follow.follower;
  }

  onFollowChange(userId: number, isNowFollowing: boolean): void {
    // If the user was unfollowed, remove them from the list
    if (!isNowFollowing) {
      this.users = this.users.filter(follow => this.getUser(follow).id !== userId);
    }
  }
}