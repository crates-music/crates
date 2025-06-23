import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../user/shared/model/user.model';

@Component({
  selector: 'crates-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss']
})
export class UserHeaderComponent {
  @Input() user: User | null = null;
  @Output() logout = new EventEmitter<void>();

  constructor(private router: Router) {}

  getDisplayName(): string {
    if (!this.user) return '';
    
    // Priority: custom handle > displayName > spotifyId
    if (this.user.handle) {
      return `@${this.user.handle}`;
    }
    if (this.user.displayName) {
      return this.user.displayName;
    }
    return this.user.spotifyId;
  }

  navigateToCrates(): void {
    this.router.navigate(['/crate/list']);
  }

  navigateToLibrary(): void {
    this.router.navigate(['/library']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/user/profile/settings']);
  }

  onLogout(): void {
    this.logout.emit();
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}