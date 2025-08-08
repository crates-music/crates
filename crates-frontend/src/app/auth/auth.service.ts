import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAuthToken, selectIsAuthenticated } from './store/selectors/auth.selectors';
import { loginSuccess, logout, checkAuthStatus } from './store/actions/auth.actions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentToken: string | null = null;
  private currentAuthStatus: boolean = false;

  constructor(private store: Store) {
    this.store.select(selectAuthToken).subscribe(token => {
      this.currentToken = token;
    });
    
    this.store.select(selectIsAuthenticated).subscribe(isAuth => {
      this.currentAuthStatus = isAuth;
    });
  }

  setToken(token: string): void {
    this.store.dispatch(loginSuccess({ token }));
  }

  getToken(): string | null {
    return this.currentToken;
  }

  logout(): void {
    this.store.dispatch(logout());
  }

  isLoggedIn(): boolean {
    return this.currentAuthStatus;
  }

  checkAuthStatus(): void {
    this.store.dispatch(checkAuthStatus());
  }

  isAuthenticated$(): Observable<boolean> {
    return this.store.select(selectIsAuthenticated);
  }
}
