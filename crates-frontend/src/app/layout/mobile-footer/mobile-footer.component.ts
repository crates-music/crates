import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil, tap, Observable, distinctUntilChanged } from 'rxjs';
import { Store } from '@ngrx/store';
import { State } from '../../store/reducers';
import { selectCurrentNavigationContext } from '../../shared/store/selectors/navigation.selectors';
import { NavigationContext } from '../../shared/store/actions/navigation.actions';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import { NavigationService, Tab, TabConfig } from '../../shared/services/navigation.service';

@Component({
  selector: 'crates-mobile-footer',
  templateUrl: './mobile-footer.component.html',
  styleUrls: ['./mobile-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileFooterComponent implements OnDestroy {
  currentTab$: Observable<Tab | undefined>;
  Tab = Tab;
  mobileTabs: TabConfig[];

  destroy$ = new Subject<boolean>();

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              private store: Store<State>,
              private navigationService: NavigationService) {
    this.currentTab$ = this.navigationService.getCurrentTab$().pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    );
    this.mobileTabs = this.navigationService.getTabsForMobile();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  navigateToTab(tab: Tab): void {
    this.navigationService.navigateToTab(tab);
  }

  onDiscoverTabClick(): void {
    this.navigationService.handleDiscoverNavigation('/discover');
  }

}
