import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser, selectUserLoaded } from './user/store/selectors/user.selectors';
import { selectIsAuthenticated } from './auth/store/selectors/auth.selectors';
import { User } from './user/shared/model/user.model';
import { Observable } from 'rxjs';

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
              private store: Store) {
    // Initialize auth status from localStorage
    this.authService.checkAuthStatus();

    this.user$ = this.store.select(selectUser);
    this.userLoaded$ = this.store.select(selectUserLoaded);
    this.loggedIn$ = this.store.select(selectIsAuthenticated);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth', 'login']);
  }
}
