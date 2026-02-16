export enum SortOption {
  RecentlyAdded = 'RecentlyAdded',
  AlbumName = 'AlbumName',
  ArtistName = 'ArtistName',
  ReleaseDate = 'ReleaseDate',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export interface AlbumSort {
  option: SortOption;
  direction: SortDirection;
}

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  [SortOption.RecentlyAdded]: 'Recently Added',
  [SortOption.AlbumName]: 'Album Name',
  [SortOption.ArtistName]: 'Artist Name',
  [SortOption.ReleaseDate]: 'Release Date',
};

const SORT_PARAM_MAP: Record<SortOption, string> = {
  [SortOption.RecentlyAdded]: 'createdAt',
  [SortOption.AlbumName]: 'album.name',
  [SortOption.ArtistName]: 'artistName',
  [SortOption.ReleaseDate]: 'album.releaseDate',
};

const DEFAULT_DIRECTIONS: Record<SortOption, SortDirection> = {
  [SortOption.RecentlyAdded]: SortDirection.Desc,
  [SortOption.AlbumName]: SortDirection.Asc,
  [SortOption.ArtistName]: SortDirection.Asc,
  [SortOption.ReleaseDate]: SortDirection.Desc,
};

export const DEFAULT_ALBUM_SORT: AlbumSort = {
  option: SortOption.RecentlyAdded,
  direction: SortDirection.Desc,
};

export function getDefaultDirection(option: SortOption): SortDirection {
  return DEFAULT_DIRECTIONS[option];
}

export function toSortParam(sort: AlbumSort): string {
  return `${SORT_PARAM_MAP[sort.option]},${sort.direction}`;
}

const STORAGE_KEY = 'crates-album-sort';

export function saveSortToStorage(sort: AlbumSort): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sort));
}

export function loadSortFromStorage(): AlbumSort {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.option in SortOption && parsed.direction in SortDirection) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_ALBUM_SORT;
}
