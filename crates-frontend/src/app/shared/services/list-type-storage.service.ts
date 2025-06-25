import { Injectable } from '@angular/core';
import { ListType } from '../model/list-type.model';

export enum StorageKey {
  LIBRARY_LIST_TYPE = 'crates-library-list-type',
  CRATES_LIST_TYPE = 'crates-crates-list-type',
  CRATE_ALBUMS_LIST_TYPE = 'crates-crate-album-list-type'
}

@Injectable({
  providedIn: 'root'
})
export class StateStorageService {

  /**
   * Save a value to localStorage with error handling
   */
  save<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }

  /**
   * Load a value from localStorage with type safety and fallback
   */
  load<T>(key: StorageKey, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  }

  /**
   * Convenience method for list type preferences
   */
  saveListType(key: StorageKey, listType: ListType): void {
    this.save(key, listType);
  }

  /**
   * Convenience method for list type preferences with validation
   */
  loadListType(key: StorageKey, defaultValue: ListType = ListType.List): ListType {
    const stored = this.load(key, defaultValue);
    if (this.isValidListType(stored)) {
      return stored as ListType;
    }
    return defaultValue;
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all app-related localStorage items
   */
  clearAll(): void {
    Object.values(StorageKey).forEach(key => this.remove(key));
  }

  /**
   * Validate that the stored value is a valid ListType
   */
  private isValidListType(value: any): boolean {
    return typeof value === 'string' && Object.values(ListType).includes(value as ListType);
  }
}