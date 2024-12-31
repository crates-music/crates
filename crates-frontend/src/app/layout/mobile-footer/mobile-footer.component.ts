import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil, tap } from 'rxjs';

export enum Tab {
  Crates = 'CRATES',
  Library = 'LIBRARY'
}

@Component({
  selector: 'crates-mobile-footer',
  templateUrl: './mobile-footer.component.html',
  styleUrls: ['./mobile-footer.component.scss']
})
export class MobileFooterComponent implements OnDestroy {
  currentTab: Tab;
  Tab = Tab;

  destroy$ = new Subject<boolean>();

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      tap(() => this.updateCurrentTab()),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private updateCurrentTab(): void {
    const segments = this.router.routerState.snapshot.url.split('/');
    console.log(segments);
    if (segments.includes('crate')) {
      this.currentTab = Tab.Crates;
    } else if (segments.includes('library')) {
      this.currentTab = Tab.Library;
    } else if (segments.includes('auth')) {
      this.currentTab = undefined;
    }
  }
}
