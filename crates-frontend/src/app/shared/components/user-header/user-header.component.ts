import { Component, Input, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../user/shared/model/user.model';
import { PublicLinkService } from '../../services/public-link.service';
import { NavigationService, Tab, TabConfig } from '../../services/navigation.service';
import { Observable, Subject, takeUntil, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'crates-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserHeaderComponent implements OnDestroy {
  @Input() user: User | null = null;
  @Output() logout = new EventEmitter<void>();

  private destroy$ = new Subject<boolean>();
  currentTab$: Observable<Tab | undefined>;
  desktopTabs: TabConfig[];
  Tab = Tab;

  constructor(
    private router: Router,
    private publicLinkService: PublicLinkService,
    private navigationService: NavigationService
  ) {
    this.currentTab$ = this.navigationService.getCurrentTab$().pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    );
    this.desktopTabs = this.navigationService.getTabsForDesktop();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

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

  navigateToTab(tab: Tab): void {
    this.navigationService.navigateToTab(tab);
  }

  navigateToCrates(): void {
    this.navigateToTab(Tab.Crates);
  }

  navigateToLibrary(): void {
    this.navigateToTab(Tab.Library);
  }

  navigateToDiscover(): void {
    this.navigateToTab(Tab.Discover);
  }

  navigateToActivity(): void {
    this.navigateToTab(Tab.Activity);
  }

  navigateToSettings(): void {
    this.router.navigate(['/user/profile/settings']);
  }

  onLogout(): void {
    this.logout.emit();
  }

  isCurrentRoute(route: string): boolean {
    return this.navigationService.isRouteActive(route);
  }

  isTabActive(tab: Tab): boolean {
    return this.navigationService.isTabActive(tab);
  }


  openPublicProfile(): void {
    if (this.user) {
      const url = this.publicLinkService.getProfileUrl(this.user);
      this.publicLinkService.openInNewTab(url);
    }
  }
}