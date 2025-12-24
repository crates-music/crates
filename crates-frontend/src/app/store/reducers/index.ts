import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { logger } from './logger.reducer';
import * as fromAuth from '../../auth/store/reducers/auth.reducer';
import * as fromUser from '../../user/store/reducers/user.reducer';
import * as fromLibrary from '../../library/store/reducers/library.reducer';
import * as fromCrate from '../../crate/store/reducers/crate.reducer';
import * as fromDiscover from '../../shared/store/reducers/discover.reducer';
import * as fromSearch from '../../shared/store/reducers/search.reducer';
import * as fromTrending from '../../shared/store/reducers/trending.reducer';
import * as fromNavigation from '../../shared/store/reducers/navigation.reducer';

export interface State {
  auth: fromAuth.AuthState,
  user: fromUser.UserState,
  library: fromLibrary.LibraryState,
  crate: fromCrate.CrateState,
  discover: fromDiscover.DiscoverState,
  search: fromSearch.SearchState,
  trending: fromTrending.TrendingState,
  navigation: fromNavigation.NavigationState
}

export const reducers: ActionReducerMap<State> = {
  auth: fromAuth.reducer,
  user: fromUser.reducer,
  library: fromLibrary.reducer,
  crate: fromCrate.reducer,
  discover: fromDiscover.discoverReducer,
  search: fromSearch.searchReducer,
  trending: fromTrending.trendingReducer,
  navigation: fromNavigation.navigationReducer
};

// export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
//   return localStorageSync({
//     keys: ['account', 'navigation', 'crates'],
//     rehydrate: true,
//   })(reducer);
// }

export const metaReducers: MetaReducer<any, any>[] =
  !environment.production ? [] : [logger];
