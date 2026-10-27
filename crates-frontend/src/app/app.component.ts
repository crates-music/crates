import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser, selectUserLoaded } from './user/store/selectors/user.selectors';
import { selectIsAuthenticated } from './auth/store/selectors/auth.selectors';
import { User } from './user/shared/model/user.model';
import { filter, Observable, take } from 'rxjs';
import { AnalyticsService } from './shared/services/analytics.service';

@Component({
  selector: 'crates-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'crate-frontend-v2';

  user$: Observable<User>;
  userLoaded$: Observable<boolean>;
  loggedIn$: Observable<boolean>;

  constructor(private authService: AuthService,
              private router: Router,
              private store: Store,
              private analytics: AnalyticsService) {
    // Initialize auth status from localStorage
    this.authService.checkAuthStatus();

    this.user$ = this.store.select(selectUser);
    this.userLoaded$ = this.store.select(selectUserLoaded);
    this.loggedIn$ = this.store.select(selectIsAuthenticated);

    this.loggedIn$.pipe(filter(Boolean), take(1)).subscribe(() => this.analytics.track({ type: 'app_open' }));
    // Paths carry only internal numeric ids (e.g. /crate/12), never handles.
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e =>
      this.analytics.track({ type: 'page_view', props: { path: e.urlAfterRedirects.split('?')[0] } }));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth', 'login']);
  }
}
