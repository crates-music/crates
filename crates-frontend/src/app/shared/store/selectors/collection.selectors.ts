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

export const selectMyCollectionData = createSelector(
  selectMyCollection,
  (myCollection) => myCollection.value
);

export const selectMyCollectionLoading = createSelector(
  selectMyCollection,
  (myCollection) => myCollection.loading
);

export const selectMyCollectionLoaded = createSelector(
  selectMyCollection,
  (myCollection) => myCollection.loaded
);

export const selectMyCollectionCrates = createSelector(
  selectMyCollectionData,
  (collectionData) => collectionData?.content || []
);

export const selectMyCollectionHasNextPage = createSelector(
  selectMyCollectionData,
  (collectionData) => !collectionData?.last
);

// Error Selectors
export const selectCollectionError = createSelector(
  selectCollectionState,
  fromCollection.getCollectionError
);