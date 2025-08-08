import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import { checkAuthStatus, loginSuccess, logout } from '../actions/auth.actions';
import { loadUser, clearUserProfile } from '../../../user/store/actions/load-user.actions';

@Injectable()
export class AuthEffects {

  constructor(private actions$: Actions) {}

  checkAuthStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(checkAuthStatus),
      map(() => {
        const token = localStorage.getItem('crate-token');
        if (token) {
          return loginSuccess({ token });
        } else {
          return logout();
        }
      })
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      tap(action => {
        localStorage.setItem('crate-token', action.token);
      }),
      map(() => loadUser())
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      tap(() => {
        localStorage.removeItem('crate-token');
      }),
      map(() => clearUserProfile())
    )
  );
}