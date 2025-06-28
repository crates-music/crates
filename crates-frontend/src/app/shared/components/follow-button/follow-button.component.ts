import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { SocialService } from '../../services/social.service';

@Component({
  selector: 'app-follow-button',
  templateUrl: './follow-button.component.html',
  styleUrls: ['./follow-button.component.scss']
})
export class FollowButtonComponent implements OnInit, OnDestroy {
  @Input() userId!: number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'outline' = 'outline';
  @Input() isFollowing: boolean | null = null;
  @Output() followChange = new EventEmitter<boolean>();

  _isFollowing = false;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<boolean>();

  constructor(private socialService: SocialService) {}

  ngOnInit() {
    if (!this.userId) {
      console.error('FollowButtonComponent: userId is required');
      return;
    }
    
    if (this.isFollowing !== null) {
      this._isFollowing = this.isFollowing;
    } else {
      this.loadFollowStatus();
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadFollowStatus() {
    this.socialService.getFollowStatus(this.userId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading follow status:', error);
        this.error = 'Failed to load follow status';
        return of({ isFollowing: false });
      })
    ).subscribe(status => {
      this._isFollowing = status.isFollowing;
    });
  }

  toggleFollow() {
    if (this.loading) return;
    
    this.loading = true;
    this.error = null;
    
    if (this._isFollowing) {
      // Unfollow action
      this.socialService.unfollowUser(this.userId).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error unfollowing user:', error);
          this.error = 'Failed to unfollow';
          this.loading = false;
          return of(null);
        })
      ).subscribe(() => {
        this._isFollowing = false;
        this.followChange.emit(false);
        this.loading = false;
      });
    } else {
      // Follow action
      this.socialService.followUser(this.userId).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error following user:', error);
          this.error = 'Failed to follow';
          this.loading = false;
          return of(null);
        })
      ).subscribe(result => {
        if (result !== null) {
          this._isFollowing = true;
          this.followChange.emit(true);
        }
        this.loading = false;
      });
    }
  }

  get buttonClass(): string {
    const sizeClass = this.size === 'sm' ? 'btn-sm' : this.size === 'lg' ? 'btn-lg' : '';
    const variantClass = this.variant === 'primary' ? 'btn-primary' : 'btn-outline-primary';
    return `btn ${variantClass} ${sizeClass}`.trim();
  }

  get buttonText(): string {
    if (this.loading) {
      return this._isFollowing ? 'Unfollowing...' : 'Following...';
    }
    return this._isFollowing ? 'Unfollow' : 'Follow';
  }
}