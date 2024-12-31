import { emptyLoadable, Loadable } from '../../../shared/model/loadable.model';
import { User } from '../../shared/model/user.model';
import { Action, createReducer, on } from '@ngrx/store';
import { loadUser, loadUserResult } from '../actions/load-user.actions';

export interface UserState {
  user: Loadable<User>;
}

export const initialState: UserState = {
  user: emptyLoadable()
}

const userReducer = createReducer(initialState,
  on(loadUser, (): UserState => {
    return {
      user: {
        loaded: false,
        loading: true,
      }
    };
  }),
  on(loadUserResult, (state, action): UserState => {
    return {
      user: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.data,
        error: action.response.error,
      }
    };
  }));

export function reducer(state: UserState | undefined, action: Action) {
  return userReducer(state, action);
}

export const getUser = (state: UserState) => state.user.value;
export const getUserLoading = (state: UserState) => state.user.loading;
export const getUserLoaded = (state: UserState) => state.user.loaded;
export const getUserError = (state: UserState) => state.user.error;
