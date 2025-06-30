import { emptyLoadable, Loadable } from '../../../shared/model/loadable.model';
import { User } from '../../shared/model/user.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Action, createReducer, on } from '@ngrx/store';
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
  updateUserProfileResult,
  clearUserProfile
} from '../actions/load-user.actions';
import { 
  addCrateToCollectionResult,
  removeCrateFromCollectionResult
} from '../../../shared/store/actions/collection.actions';

export interface UserState {
  user: Loadable<User>;
  viewedUser: Loadable<User>;
  viewedUserCrates: Loadable<Crate[]>;
  viewedUserCollection: Loadable<Crate[]>;
}

export const initialState: UserState = {
  user: emptyLoadable(),
  viewedUser: emptyLoadable(),
  viewedUserCrates: emptyLoadable(),
  viewedUserCollection: emptyLoadable()
}

const userReducer = createReducer(initialState,
  on(loadUser, (state): UserState => {
    return {
      ...state,
      user: {
        ...state.user,
        loaded: false,
        loading: true,
      }
    };
  }),
  on(loadUserResult, (state, action): UserState => {
    return {
      ...state,
      user: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.data,
        error: action.response.error,
      }
    };
  }),
  on(updateUserProfile, (state): UserState => {
    return {
      ...state,
      user: {
        ...state.user,
        loading: true,
      }
    };
  }),
  on(updateUserProfileResult, (state, action): UserState => {
    return {
      ...state,
      user: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.success ? action.response.data : state.user.value,
        error: action.response.error,
      }
    };
  }),
  on(loadUserById, (state): UserState => {
    return {
      ...state,
      viewedUser: {
        ...state.viewedUser,
        loaded: false,
        loading: true,
      }
    };
  }),
  on(loadUserByIdResult, (state, action): UserState => {
    return {
      ...state,
      viewedUser: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.data,
        error: action.response.error,
      }
    };
  }),
  on(loadUserPublicCrates, (state): UserState => {
    return {
      ...state,
      viewedUserCrates: {
        ...state.viewedUserCrates,
        loaded: false,
        loading: true,
      }
    };
  }),
  on(loadUserPublicCratesResult, (state, action): UserState => {
    return {
      ...state,
      viewedUserCrates: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.success ? action.response.data?.content || [] : [],
        error: action.response.error,
      }
    };
  }),
  on(loadUserPublicCollection, (state): UserState => {
    return {
      ...state,
      viewedUserCollection: {
        ...state.viewedUserCollection,
        loaded: false,
        loading: true,
      }
    };
  }),
  on(loadUserPublicCollectionResult, (state, action): UserState => {
    return {
      ...state,
      viewedUserCollection: {
        loading: false,
        loaded: !!action.response.success,
        value: action.response.success ? action.response.data?.content || [] : [],
        error: action.response.error,
      }
    };
  }),
  on(clearUserProfile, (state): UserState => {
    return {
      ...state,
      viewedUser: emptyLoadable(),
      viewedUserCrates: emptyLoadable(),
      viewedUserCollection: emptyLoadable()
    };
  }),
  
  // Collection actions - update crate.collected field in viewedUserCrates
  on(addCrateToCollectionResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUserCrates.value) {
      return state;
    }
    
    // Find and update the crate in viewedUserCrates
    const updatedCrates = state.viewedUserCrates.value.map(crate => 
      crate.id === action.crateId 
        ? { ...crate, collected: true }
        : crate
    );
    
    return {
      ...state,
      viewedUserCrates: {
        ...state.viewedUserCrates,
        value: updatedCrates
      }
    };
  }),
  
  on(removeCrateFromCollectionResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUserCrates.value) {
      return state;
    }
    
    // Find and update the crate in viewedUserCrates
    const updatedCrates = state.viewedUserCrates.value.map(crate => 
      crate.id === action.crateId 
        ? { ...crate, collected: false }
        : crate
    );
    
    return {
      ...state,
      viewedUserCrates: {
        ...state.viewedUserCrates,
        value: updatedCrates
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

export const getViewedUser = (state: UserState) => state.viewedUser.value;
export const getViewedUserLoading = (state: UserState) => state.viewedUser.loading;
export const getViewedUserLoaded = (state: UserState) => state.viewedUser.loaded;
export const getViewedUserError = (state: UserState) => state.viewedUser.error;

export const getViewedUserCrates = (state: UserState) => state.viewedUserCrates.value;
export const getViewedUserCratesLoading = (state: UserState) => state.viewedUserCrates.loading;
export const getViewedUserCratesLoaded = (state: UserState) => state.viewedUserCrates.loaded;
export const getViewedUserCratesError = (state: UserState) => state.viewedUserCrates.error;

export const getViewedUserCollection = (state: UserState) => state.viewedUserCollection.value;
export const getViewedUserCollectionLoading = (state: UserState) => state.viewedUserCollection.loading;
export const getViewedUserCollectionLoaded = (state: UserState) => state.viewedUserCollection.loaded;
export const getViewedUserCollectionError = (state: UserState) => state.viewedUserCollection.error;
