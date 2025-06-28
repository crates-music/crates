import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CollectionState } from '../reducers/collection.reducer';
import * as fromCollection from '../reducers/collection.reducer';

export const selectCollectionState = createFeatureSelector<CollectionState>('collection');

// Collection Status Selectors
export const selectCollectionStatus = createSelector(
  selectCollectionState,
  fromCollection.getCollectionStatus
);

export const selectCollectionLoading = createSelector(
  selectCollectionState,
  fromCollection.getCollectionLoading
);

export const selectCrateCollectionStatus = (crateId: number) => createSelector(
  selectCollectionStatus,
  (collectionStatus) => collectionStatus[crateId] || { inCollection: false }
);

export const selectCrateCollectionLoading = (crateId: number) => createSelector(
  selectCollectionLoading,
  (collectionLoading) => collectionLoading[crateId] || false
);

// My Collection Selectors
export const selectMyCollection = createSelector(
  selectCollectionState,
  fromCollection.getMyCollection
);

export const selectMyCollectionLoading = createSelector(
  selectCollectionState,
  fromCollection.getMyCollectionLoading
);

// Error Selectors
export const selectCollectionError = createSelector(
  selectCollectionState,
  fromCollection.getCollectionError
);