import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { CrateEvent, CrateEventType } from '../../shared/model/crate-event.model';
import { Album } from '../../library/shared/model/album.model';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';

@Component({
  selector: 'app-activity-item',
  templateUrl: './activity-item.component.html',
  styleUrls: ['./activity-item.component.scss']
})
export class ActivityItemComponent {
  @Input() activity!: CrateEvent;
  
  CrateEventType = CrateEventType;

  constructor(
    private router: Router,
    private store: Store
  ) {}

  openUser(): void {
    if (this.activity.user) {
      this.store.dispatch(NavigationActions.trackUserNavigation({ 
        userId: this.activity.user.id, 
        fromContext: 'activity' 
      }));
      this.router.navigate(['/user', this.activity.user.id]);
    }
  }

  openCrate(): void {
    if (this.activity.crate) {
      this.store.dispatch(NavigationActions.trackCrateNavigation({ 
        crateId: this.activity.crate.id, 
        fromContext: 'activity',
        isOwnCrate: false
      }));
      this.router.navigate(['/crate', this.activity.crate.id]);
    }
  }

  openFollowedUser(): void {
    if (this.activity.followedUser) {
      this.store.dispatch(NavigationActions.trackUserNavigation({ 
        userId: this.activity.followedUser.id, 
        fromContext: 'activity' 
      }));
      this.router.navigate(['/user', this.activity.followedUser.id]);
    }
  }

  getEventDescription(): string {
    switch (this.activity.eventType) {
      case CrateEventType.CRATE_RELEASED:
        return 'made their crate public';
      case CrateEventType.ALBUM_ADDED:
        const albumCount = this.activity.albumIds?.length || 0;
        return albumCount === 1 ? 'added an album to' : `added ${albumCount} albums to`;
      case CrateEventType.CRATE_ADDED_TO_COLLECTION:
        return 'saved a crate to their collection';
      case CrateEventType.USER_FOLLOWED:
        return 'followed';
      default:
        return 'had activity on';
    }
  }

  getEventIcon(): string {
    switch (this.activity.eventType) {
      case CrateEventType.CRATE_RELEASED:
        return 'bi-eye';
      case CrateEventType.ALBUM_ADDED:
        return 'bi-plus-circle';
      case CrateEventType.CRATE_ADDED_TO_COLLECTION:
        return 'bi-bookmark';
      case CrateEventType.USER_FOLLOWED:
        return 'bi-person-plus';
      default:
        return 'bi-activity';
    }
  }

  getEventColor(): string {
    switch (this.activity.eventType) {
      case CrateEventType.CRATE_RELEASED:
        return 'text-success';
      case CrateEventType.ALBUM_ADDED:
        return 'text-primary';
      case CrateEventType.CRATE_ADDED_TO_COLLECTION:
        return 'text-warning';
      case CrateEventType.USER_FOLLOWED:
        return 'text-info';
      default:
        return 'text-muted';
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const activityDate = new Date(this.activity.createdAt);
    const diffMs = now.getTime() - activityDate.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (minutes < 1) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else if (weeks < 4) {
      return `${weeks}w ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  }

  getAlbumImageUrl(album: Album): string {
    if (album.images && album.images.length > 0) {
      // Get a medium-sized image (typically 300x300 from Spotify)
      // Create a copy and sort by width descending
      const sortedImages = [...album.images].sort((a, b) => (b.width || 0) - (a.width || 0));
      if (sortedImages.length >= 2) {
        return sortedImages[1].url; // Second largest (usually 300x300)
      } else {
        return sortedImages[0].url; // Only one image available
      }
    }
    return '/assets/images/default-album.png';
  }

  getArtistNames(album: Album): string {
    if (album.artists && album.artists.length > 0) {
      return album.artists.map(artist => artist.name).join(', ');
    }
    return 'Unknown Artist';
  }

}