import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { UserService } from '../../shared/service/user.service';
import { 
  loadUser, 
  loadUserResult, 
  loadUserById,
  loadUserByIdResult,
  loadUserPublicCrates,
  loadUserPublicCratesResult,
  loadUserPublicCollection,
  loadUserPublicCollectionResult,
  updateUserProfile, 
  updateUserProfileResult 
} from '../actions/load-user.actions';
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
        bio: action.bio,
        email: action.email,
        emailOptIn: action.emailOptIn,
        privateProfile: action.privateProfile
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

  loadUserById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserById),
      exhaustMap(action => this.userService.getUserById(action.userId)
        .pipe(
          map(user => loadUserByIdResult({
            userId: action.userId,
            response: {
              data: user,
              success: true,
            }
          })),
          catchError(err => of(loadUserByIdResult({
            userId: action.userId,
            response: {
              success: false,
              error: Object.assign(new ApiError(err.message), err) as ApiError,
            }
          })))
        ))
    ));

  loadUserPublicCrates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserPublicCrates),
      exhaustMap(action => this.userService.getUserPublicCrates(action.userId, action.search)
        .pipe(
          map(page => loadUserPublicCratesResult({
            userId: action.userId,
            response: {
              data: page,
              success: true,
            }
          })),
          catchError(err => of(loadUserPublicCratesResult({
            userId: action.userId,
            response: {
              success: false,
              error: Object.assign(new ApiError(err.message), err) as ApiError,
            }
          })))
        ))
    ));

  loadUserPublicCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserPublicCollection),
      exhaustMap(action => this.userService.getUserPublicCollection(action.userId, action.search)
        .pipe(
          map(page => loadUserPublicCollectionResult({
            userId: action.userId,
            response: {
              data: page,
              success: true,
            }
          })),
          catchError(err => of(loadUserPublicCollectionResult({
            userId: action.userId,
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
