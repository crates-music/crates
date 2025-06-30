import { createReducer, on } from '@ngrx/store';
import { CollectionStatus } from '../../model/social-stats.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Page } from '../../model/page.model';
import { Loadable, emptyLoadable } from '../../model/loadable.model';
import * as CollectionActions from '../actions/collection.actions';

export interface CollectionState {
  // Collection status for different crates
  collectionStatus: { [crateId: number]: CollectionStatus };
  collectionLoading: { [crateId: number]: boolean };
  
  // User's collection
  myCollection: Loadable<Page<Crate>>;
  
  // Error states
  error: any;
}

export const initialState: CollectionState = {
  collectionStatus: {},
  collectionLoading: {},
  myCollection: emptyLoadable(),
  error: null
};

export const collectionReducer = createReducer(
  initialState,
  
  // Add Crate to Collection
  on(CollectionActions.addCrateToCollection, (state, { crateId }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: true },
    error: null
  })),
  
  on(CollectionActions.addCrateToCollectionResult, (state, { crateId, response }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: false },
    collectionStatus: response.success ? { 
      ...state.collectionStatus, 
      [crateId]: { inCollection: true }
    } : state.collectionStatus,
    error: response.success ? null : response.error
  })),
  
  // Remove Crate from Collection
  on(CollectionActions.removeCrateFromCollection, (state, { crateId }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: true },
    error: null
  })),
  
  on(CollectionActions.removeCrateFromCollectionResult, (state, { crateId, response }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: false },
    collectionStatus: response.success ? { 
      ...state.collectionStatus, 
      [crateId]: { inCollection: false }
    } : state.collectionStatus,
    error: response.success ? null : response.error
  })),
  
  // Load Collection Status - don't show loading for initial status checks
  on(CollectionActions.loadCollectionStatus, (state, { crateId }) => state),
  
  on(CollectionActions.loadCollectionStatusResult, (state, { crateId, response }) => ({
    ...state,
    collectionStatus: response.success ? { 
      ...state.collectionStatus, 
      [crateId]: response.data! 
    } : state.collectionStatus,
    error: response.success ? null : response.error
  })),
  
  // Load My Collection
  on(CollectionActions.loadMyCollection, (state) => ({
    ...state,
    myCollection: { ...state.myCollection, loading: true },
    error: null
  })),
  
  on(CollectionActions.loadMyCollectionResult, (state, { response }) => ({
    ...state,
    myCollection: {
      loading: false,
      loaded: true,
      value: response.success ? response.data! : state.myCollection.value,
      error: response.success ? null : response.error
    },
    error: response.success ? null : response.error
  })),
  
  // Clear Errors
  on(CollectionActions.clearCollectionErrors, (state) => ({
    ...state,
    error: null
  }))
);

// Selector functions
export const getCollectionStatus = (state: CollectionState) => state.collectionStatus;
export const getCollectionLoading = (state: CollectionState) => state.collectionLoading;
export const getMyCollection = (state: CollectionState) => state.myCollection;
export const getCollectionError = (state: CollectionState) => state.error;