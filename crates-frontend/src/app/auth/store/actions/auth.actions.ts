import { createAction, props } from '@ngrx/store';

export const checkAuthStatus = createAction('[Auth] Check Auth Status');

export const loginSuccess = createAction(
  '[Auth] Login Success', 
  props<{ token: string }>()
);

export const logout = createAction('[Auth] Logout');

export const authError = createAction(
  '[Auth] Auth Error', 
  props<{ error: string }>()
);