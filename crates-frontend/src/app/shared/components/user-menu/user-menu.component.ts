import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../user/shared/model/user.model';

@Component({
  selector: 'crates-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
  @Input() user: User | null = null;
  @Input() isMobile = false;
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

  navigateToSettings(): void {
    this.router.navigate(['/user/profile/settings']);
  }

  onLogout(): void {
    this.logout.emit();
  }
}
