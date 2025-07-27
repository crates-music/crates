import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser, selectUserLoaded } from './user/store/selectors/user.selectors';
import { User } from './user/shared/model/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { loadUser } from './user/store/actions/load-user.actions';

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
    this.store.dispatch(loadUser());

    this.user$ = this.store.select(selectUser);
    this.userLoaded$ = this.store.select(selectUserLoaded);
    
    // Convert loggedIn to an observable to prevent change detection issues
    this.loggedIn$ = this.userLoaded$.pipe(
      map(() => this.authService.isLoggedIn())
    );
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth', 'login']);
  }
}
