import { Crate } from '../../shared/model/crate.model';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { emptyLoadable, Loadable } from '../../../shared/model/loadable.model';
import { Action, createReducer, on } from '@ngrx/store';
import {
  loadCrate,
  loadCrateResult,
  loadCrates,
  loadCratesResult,
  reloadCrates,
  reloadCratesResult,
  toggleCratesListType
} from '../actions/load-crates.actions';
import {
  addAlbumsToCrate,
  addAlbumToCrateResult,
  loadCrateAlbums,
  loadCrateAlbumsResult,
  reloadCrateAlbums,
  reloadCrateAlbumsResult,
  removeAlbumFromCrate,
  removeAlbumFromCrateResult, toggleCrateAlbumListType
} from '../actions/crate-album.actions';
import { CrateAlbum } from '../../shared/model/crate-album.model';
import { ListType } from '../../../shared/model/list-type.model';

export interface CrateEntityState extends EntityState<Crate> {
}

export const crateAdapter: EntityAdapter<Crate> = createEntityAdapter({
  selectId: crate => crate.id
});

export interface CrateAlbumEntityState extends EntityState<CrateAlbum> {
}

export const crateAlbumAdapter: EntityAdapter<CrateAlbum> = createEntityAdapter({
  selectId: crateAlbum => crateAlbum.id
});

export interface CrateState {
  crate: Loadable<Crate>;
  crates: Loadable<CrateEntityState>;
  crateAlbums: Loadable<CrateAlbumEntityState>;
  crateAlbumSearch?: string;
  crateAlbumListType: ListType;
  addingAlbums: Loadable<void>;
  removingAlbum: Loadable<void>;
  search?: string;
  listType: ListType;
}

export const initialState: CrateState = {
  crate: emptyLoadable(),
  crates: {
    value: crateAdapter.getInitialState(),
    loaded: false,
    loading: false,
    hasNextPage: false,
  },
  crateAlbums: {
    value: crateAlbumAdapter.getInitialState(),
    loaded: false,
    loading: false,
    hasNextPage: false,
  },
  crateAlbumListType: ListType.List,
  addingAlbums: emptyLoadable(),
  removingAlbum: emptyLoadable(),
  search: undefined,
  listType: ListType.List
};

const crateReducer = createReducer(initialState,
  on(loadCrates, (state, action) => {
    return {
      ...state,
      search: action.search,
      crates: {
        ...state.crates,
        loaded: false,
        loading: true
      }
    };
  }),
  on(reloadCrates, (state, action) => {
    return {
      ...state,
      search: action.search,
      crates: {
        ...state.crates,
        loaded: false,
        loading: true
      }
    };
  }),
  on(loadCratesResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crates: {
          value: crateAdapter.addMany(action.response.data.content, state.crates.value),
          loaded: true,
          loading: false,
          hasNextPage: !action.response.data.last,
        },
      };
    }
    return {
      ...state,
      crates: {
        ...state.crates,
        loaded: false,
        loading: false,
        error: action.response.error
      }
    };
  }),
  on(reloadCratesResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crates: {
          value: crateAdapter.setAll(action.response.data.content, state.crates.value),
          loaded: true,
          loading: false,
          hasNextPage: !action.response.data.last,
        },
      };
    }
    return {
      ...state,
      crates: {
        ...state.crates,
        loaded: false,
        loading: false,
        error: action.response.error
      }
    };
  }),
  on(toggleCratesListType, (state, action) => {
    return {
      ...state,
      listType: action.listType
    }
  }),
  on(addAlbumsToCrate, (state, action) => {
    return {
      ...state,
      addingAlbums: {
        value: undefined,
        loading: true,
        loaded: false,
      }
    }
  }),
  on(addAlbumToCrateResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crates: {
          ...state.crates,
          value: crateAdapter.upsertOne(action.response.data, state.crates.value)
        },
        addingAlbums: {
          ...state.addingAlbums,
          loading: false,
          loaded: true,
        }
      }
    }
    return {
      ...state,
      addingAlbums: {
        ...state.addingAlbums,
        loading: false,
        loaded: false,
        error: action.response.error
      }
    };
  }),
  on(removeAlbumFromCrate, (state, action) => {
    return {
      ...state,
      removingAlbum: {
        value: undefined,
        loading: true,
        loaded: false,
      }
    }
  }),
  on(removeAlbumFromCrateResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crates: {
          ...state.crates,
          value: crateAdapter.upsertOne(action.response.data, state.crates.value)
        },
        removingAlbum: {
          ...state.removingAlbum,
          loading: false,
          loaded: true,
        }
      } as CrateState;
    }
    return {
      ...state,
      removingAlbum: {
        ...state.removingAlbum,
        loading: false,
        loaded: false,
        error: action.response.error
      }
    } as CrateState;
  }),
  on(loadCrateAlbums, (state, action) => {
    return {
      ...state,
      crateAlbums: {
        ...state.crateAlbums,
        loading: true,
        loaded: false
      }
    }
  }),
  on(reloadCrateAlbums, (state, action) => {
    return {
      ...state,
      crateAlbumSearch: action.search,
      crateAlbums: {
        ...state.crateAlbums,
        loading: true,
        loaded: false
      }
    }
  }),
  on(loadCrateAlbumsResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crateAlbums: {
          value: crateAlbumAdapter.addMany(action.response.data.content, crateAlbumAdapter.getInitialState()),
          loaded: true,
          loading: false,
          hasNextPage: !action.response.data.last,
        }
      };
    }
    return {
      ...state,
      crateAlbums: {
        ...state.crateAlbums,
        loading: false,
        loaded: false,
        error: action.response.error,
      }
    };
  }),
  on(reloadCrateAlbumsResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crateAlbums: {
          value: crateAlbumAdapter.setAll(action.response.data.content, state.crateAlbums.value),
          loaded: true,
          loading: false,
          hasNextPage: !action.response.data.last,
        }
      };
    }
    return {
      ...state,
      crateAlbums: {
        ...state.crateAlbums,
        loading: false,
        loaded: false,
        error: action.response.error,
      }
    };
  }),
  on(toggleCrateAlbumListType, (state, action) => {
    return {
      ...state,
      crateAlbumListType: action.listType,
    };
  }),
  on(loadCrate, (state) => {
    return {
      ...state,
      crate: {
        loading: true,
        loaded: false,
      }
    };
  }),
  on(loadCrateResult, (state, action) => {
    if (action.response.success) {
      return {
        ...state,
        crate: {
          value: action.response.data,
          loading: false,
          loaded: true,
        }
      };
    }
    return {
      ...state,
      crate: {
        loading: false,
        loaded: false,
        error: action.response.error,
      }
    };
  })
);

export function reducer(state: CrateState | undefined, action: Action): CrateState {
  return crateReducer(state, action);
}

export const { selectAll, selectTotal } = crateAdapter.getSelectors();
export const selectAllCrateAlbums = crateAlbumAdapter.getSelectors().selectAll;
export const selectTotalCrateAlbums = crateAlbumAdapter.getSelectors().selectTotal;
