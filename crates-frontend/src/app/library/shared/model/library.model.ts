export enum LibraryState {
  Importing = 'IMPORTING',
  ImportingAfterFirstPage = 'IMPORTING_AFTER_FIRST_PAGE',
  Imported = 'IMPORTED',
  ImportFailed = 'IMPORT_FAILED',
  Updating = 'UPDATING',
  Updated = 'UPDATED',
  UpdateFailed = 'UPDATE_FAILED',
  Archived = 'ARCHIVED'
}

export class Library {
  id: number;
  state: LibraryState;
  createdAt: Date;
  updatedAt: Date;
}
