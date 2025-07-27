import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, Observable, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as SocialActions from '../../store/actions/social.actions';
import { selectUserFollowStatus, selectUserFollowLoading } from '../../store/selectors/social.selectors';

@Component({
  selector: 'app-follow-button',
  templateUrl: './follow-button.component.html',
  styleUrls: ['./follow-button.component.scss']
})
export class FollowButtonComponent implements OnInit, OnDestroy {
  @Input() userId!: number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'outline' = 'outline';
  @Output() followChange = new EventEmitter<boolean>();

  isFollowing$: Observable<boolean>;
  loading$: Observable<boolean>;

  private destroy$ = new Subject<boolean>();

  constructor(private store: Store) {}

  ngOnInit() {
    if (!this.userId) {
      console.error('FollowButtonComponent: userId is required');
      return;
    }
    
    // Set up observables
    this.isFollowing$ = this.store.select(selectUserFollowStatus(this.userId)).pipe(
      map(status => status.isFollowing)
    );
    this.loading$ = this.store.select(selectUserFollowLoading(this.userId));
    
    
    // Load follow status
    this.store.dispatch(SocialActions.loadFollowStatus({ userId: this.userId }));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleFollow() {
    // Use take(1) to get the current value only once and prevent subscription loops
    this.isFollowing$.pipe(
      take(1)
    ).subscribe(isFollowing => {
      if (isFollowing) {
        this.store.dispatch(SocialActions.unfollowUser({ userId: this.userId }));
      } else {
        this.store.dispatch(SocialActions.followUser({ userId: this.userId }));
      }
      
      // Emit the change asynchronously to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isFollowing$.pipe(take(1)).subscribe(newFollowingState => {
          this.followChange.emit(newFollowingState);
        });
      }, 0);
    });
  }

  get buttonClass(): string {
    const sizeClass = this.size === 'sm' ? 'btn-sm' : this.size === 'lg' ? 'btn-lg' : '';
    const variantClass = this.variant === 'primary' ? 'btn-primary' : 'btn-outline-primary';
    return `btn ${variantClass} ${sizeClass}`.trim();
  }

  getButtonText(isFollowing: boolean, loading: boolean): string {
    if (loading) {
      return isFollowing ? 'Unfollowing...' : 'Following...';
    }
    return isFollowing ? 'Unfollow' : 'Follow';
  }
}