import { createReducer, on } from '@ngrx/store';
import { CollectionStatus } from '../../model/social-stats.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { Page } from '../../model/page.model';
import * as CollectionActions from '../actions/collection.actions';

export interface CollectionState {
  // Collection status for different crates
  collectionStatus: { [crateId: number]: CollectionStatus };
  collectionLoading: { [crateId: number]: boolean };
  
  // User's collection
  myCollection: Page<Crate> | null;
  myCollectionLoading: boolean;
  
  // Error states
  error: any;
}

export const initialState: CollectionState = {
  collectionStatus: {},
  collectionLoading: {},
  myCollection: null,
  myCollectionLoading: false,
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
  
  // Load Collection Status
  on(CollectionActions.loadCollectionStatus, (state, { crateId }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: true }
  })),
  
  on(CollectionActions.loadCollectionStatusResult, (state, { crateId, response }) => ({
    ...state,
    collectionLoading: { ...state.collectionLoading, [crateId]: false },
    collectionStatus: response.success ? { 
      ...state.collectionStatus, 
      [crateId]: response.data! 
    } : state.collectionStatus,
    error: response.success ? null : response.error
  })),
  
  // Load My Collection
  on(CollectionActions.loadMyCollection, (state) => ({
    ...state,
    myCollectionLoading: true,
    error: null
  })),
  
  on(CollectionActions.loadMyCollectionResult, (state, { response }) => ({
    ...state,
    myCollectionLoading: false,
    myCollection: response.success ? response.data! : null,
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
export const getMyCollectionLoading = (state: CollectionState) => state.myCollectionLoading;
export const getCollectionError = (state: CollectionState) => state.error;