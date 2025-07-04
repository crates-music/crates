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
import { 
  loadUserSocialStatsResult,
  followUserResult,
  unfollowUserResult
} from '../../../shared/store/actions/social.actions';

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
  
  // Collection actions - update crate.collected field and follower count in viewedUserCrates
  on(addCrateToCollectionResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUserCrates.value) {
      return state;
    }
    
    // Find and update the crate in viewedUserCrates
    const updatedCrates = state.viewedUserCrates.value.map(crate => 
      crate.id === action.crateId 
        ? { 
            ...crate, 
            collected: true,
            followerCount: (crate.followerCount || 0) + 1
          }
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
        ? { 
            ...crate, 
            collected: false,
            followerCount: Math.max(0, (crate.followerCount || 0) - 1)
          }
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
  
  // Update viewed user with social stats
  on(loadUserSocialStatsResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUser.value || state.viewedUser.value.id !== action.userId) {
      return state;
    }
    
    const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(state.viewedUser.value)), state.viewedUser.value, {
      followerCount: action.response.data?.followerCount,
      followingCount: action.response.data?.followingCount
    });
    
    return {
      ...state,
      viewedUser: {
        ...state.viewedUser,
        value: updatedUser
      }
    };
  }),
  
  // Update viewed user follower count optimistically on follow actions
  on(followUserResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUser.value || state.viewedUser.value.id !== action.userId) {
      return state;
    }
    
    const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(state.viewedUser.value)), state.viewedUser.value, {
      followerCount: (state.viewedUser.value.followerCount || 0) + 1
    });
    
    return {
      ...state,
      viewedUser: {
        ...state.viewedUser,
        value: updatedUser
      }
    };
  }),
  
  // Update viewed user follower count optimistically on unfollow actions
  on(unfollowUserResult, (state, action): UserState => {
    if (!action.response.success || !state.viewedUser.value || state.viewedUser.value.id !== action.userId) {
      return state;
    }
    
    const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(state.viewedUser.value)), state.viewedUser.value, {
      followerCount: Math.max(0, (state.viewedUser.value.followerCount || 0) - 1)
    });
    
    return {
      ...state,
      viewedUser: {
        ...state.viewedUser,
        value: updatedUser
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
