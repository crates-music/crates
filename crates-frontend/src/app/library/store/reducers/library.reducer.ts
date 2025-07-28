import { Action, createReducer, on } from '@ngrx/store';
import { Album } from '../../shared/model/album.model';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Loadable } from '../../../shared/model/loadable.model';
import { LibraryAlbumFilter } from '../../shared/model/library-album-filter.enum';
import { loadAlbums, loadAlbumsResult, reloadAlbums } from '../actions/load-albums.actions';
import { clearAlbumSelection, toggleAlbumSelection } from '../actions/album-selection.action';
import { Library, LibraryState as LibraryStateEnum } from '../../shared/model/library.model';
import { loadLibrary, loadLibraryResult, syncLibrary, syncLibraryResult } from '../actions/sync.actions';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../../shared/model/pageable.model';
import { addAlbumToCrateResult } from '../../../crate/store/actions/crate-album.actions';
import { hideCratedAlbums, showCratedAlbums, toggleListType } from '../actions/library-option.actions';
import { ListType } from '../../../shared/model/list-type.model';

export interface AlbumEntityState extends EntityState<Album> {
}

export const albumAdapter: EntityAdapter<Album> = createEntityAdapter({
  selectId: album => album.spotifyId,
});

export interface LibraryState {
  library: Loadable<Library>;
  albums: Loadable<AlbumEntityState>;
  filters: LibraryAlbumFilter[];
  hideCrated: boolean;
  search?: string;
  albumPageable: Pageable;
  listType: ListType;
}

export const initialState: LibraryState = {
  library: {
    value: undefined,
    loaded: false,
    loading: false,
  },
  albums: {
    value: albumAdapter.getInitialState(),
    loaded: false,
    loading: false,
  },
  filters: [],
  search: undefined,
  albumPageable: Pageable.of(0, DEFAULT_PAGE_SIZE),
  hideCrated: true, // TODO: load from localstorage
  listType: ListType.List // Will be loaded from localStorage via effects
};

const libraryReducer = createReducer(initialState,
  on(loadAlbums, (state, action): LibraryState => {
    return {
      ...state,
      albums: {
        ...state.albums,
        loading: true,
        loaded: false,
        error: undefined
      },
      filters: action.filters,
      search: action.search,
      albumPageable: action.pageable
    }
  }),
  on(loadAlbumsResult, (state, action): LibraryState => {
    if (action.response.success) {
      return {
        ...state,
        albums: {
          value: albumAdapter.addMany(action.response.data.content, state.albums.value),
          loading: false,
          loaded: true,
          hasNextPage: !action.response.data.last,
          error: undefined
        }
      }
    }
    return {
      ...state,
      albums: {
        ...state.albums,
        loading: false,
        loaded: false,
        error: action.response.error,
      }
    }
  }),
  on(reloadAlbums, (state, action): LibraryState => {
    return {
      ...state,
      albums: {
        value: albumAdapter.removeAll(state.albums.value),
        loading: true,
        loaded: false,
        error: undefined
      },
      albumPageable: action.pageable,
    };
  }),
  on(toggleAlbumSelection, (state, action): LibraryState => {
    console.log('toggleAlbumSelection reducer called for:', action.album.name, 'current selected:', action.album.selected, 'will be:', !action.album.selected);
    return {
      ...state,
      albums: {
        ...state.albums,
        value: albumAdapter.updateOne({
          id: action.album.spotifyId,
          changes: { selected: !action.album.selected }
        }, state.albums.value),
      }
    }
  }),
  on(clearAlbumSelection, (state): LibraryState => {
    return {
      ...state,
      albums: {
        ...state.albums,
        value: albumAdapter.map(album => {
          const updatedAlbum = Object.assign(new Album(), album);
          updatedAlbum.selected = false;
          return updatedAlbum;
        }, state.albums.value),
      }
    }
  }),
  on(syncLibrary, (state) => {
    return {
      ...state,
      library: {
        ...state.library,
        value: {
          ...state.library.value,
          state: LibraryStateEnum.Updating
        },
        loading: true,
        loaded: false,
      }
    };
  }),
  on(syncLibraryResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        library: {
          value: action.response.data,
          loading: false,
          loaded: true,
        }
      };
    }
    return {
      ...state,
      library: {
        ...state.library,
        loading: false,
        loaded: false,
        error: action.response.error
      }
    };
  }),
  on(loadLibrary, (state) => {
    return {
      ...state,
      library: {
        ...state.library,
        loading: true,
        loaded: false,
      }
    };
  }),
  on(loadLibraryResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        library: {
          value: action.response.data,
          loading: false,
          loaded: true,
        }
      };
    }
    return {
      ...state,
      library: {
        ...state.library,
        loading: false,
        loaded: false,
        error: action.response.error
      }
    };
  }),
  on(hideCratedAlbums, (state) => {
    return {
      ...state,
      hideCrated: true,
    };
  }),
  on(showCratedAlbums, (state) => {
    return {
      ...state,
      hideCrated: false,
    }
  }),
  on(addAlbumToCrateResult, (state, action) => {
    if (action.response.success && state.hideCrated) {
      return {
        ...state,
        albums: {
          ...state.albums,
          value: albumAdapter.removeMany(action.albums.map(album => album.spotifyId), state.albums.value)
        },
      }
    }
    return state
  }),
  on(toggleListType, (state, action) => {
    return {
      ...state,
      listType: action.listType
    };
  })
);

export function reducer(state: LibraryState | undefined, action: Action) {
  return libraryReducer(state, action);
}

export const { selectAll, selectTotal } = albumAdapter.getSelectors();
