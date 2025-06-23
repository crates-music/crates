import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { UserService } from '../../shared/service/user.service';
import { loadUser, loadUserResult, updateUserProfile, updateUserProfileResult } from '../actions/load-user.actions';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ApiError } from '../../../shared/model/api-error.model';

@Injectable({
  providedIn: 'root'
})
export class UserEffects {
  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUser),
      exhaustMap(action => this.userService.getUser()
        .pipe(
          map(user => loadUserResult({
            response: {
              data: user,
              success: true,
            }
          })),
          catchError(err => of(loadUserResult({
            response: {
              success: false,
              error: Object.assign(new ApiError(err.message), err) as ApiError,
            }
          })))
        ))
    ));

  updateUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateUserProfile),
      exhaustMap(action => this.userService.updateProfile({
        handle: action.handle,
        bio: action.bio
      })
        .pipe(
          map(user => updateUserProfileResult({
            response: {
              data: user,
              success: true,
            }
          })),
          catchError(err => of(updateUserProfileResult({
            response: {
              success: false,
              error: Object.assign(new ApiError(err.message), err) as ApiError,
            }
          })))
        ))
    ));

  constructor(private actions$: Actions,
              private userService: UserService) {
  }
}
