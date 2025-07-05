import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { logger } from './logger.reducer';
import * as fromUser from '../../user/store/reducers/user.reducer';
import * as fromLibrary from '../../library/store/reducers/library.reducer';
import * as fromCrate from '../../crate/store/reducers/crate.reducer';
import * as fromSocial from '../../shared/store/reducers/social.reducer';
import * as fromCollection from '../../shared/store/reducers/collection.reducer';
import * as fromDiscover from '../../shared/store/reducers/discover.reducer';
import * as fromSearch from '../../shared/store/reducers/search.reducer';
import * as fromTrending from '../../shared/store/reducers/trending.reducer';
import * as fromNavigation from '../../shared/store/reducers/navigation.reducer';
import * as fromActivity from '../../shared/store/reducers/activity.reducer';

export interface State {
  user: fromUser.UserState,
  library: fromLibrary.LibraryState,
  crate: fromCrate.CrateState,
  social: fromSocial.SocialState,
  collection: fromCollection.CollectionState,
  discover: fromDiscover.DiscoverState,
  search: fromSearch.SearchState,
  trending: fromTrending.TrendingState,
  navigation: fromNavigation.NavigationState,
  activity: fromActivity.ActivityState
}

export const reducers: ActionReducerMap<State> = {
  user: fromUser.reducer,
  library: fromLibrary.reducer,
  crate: fromCrate.reducer,
  social: fromSocial.socialReducer,
  collection: fromCollection.collectionReducer,
  discover: fromDiscover.discoverReducer,
  search: fromSearch.searchReducer,
  trending: fromTrending.trendingReducer,
  navigation: fromNavigation.navigationReducer,
  activity: fromActivity.activityReducer,
};

// export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
//   return localStorageSync({
//     keys: ['account', 'navigation', 'crates'],
//     rehydrate: true,
//   })(reducer);
// }

export const metaReducers: MetaReducer<any, any>[] =
  !environment.production ? [] : [logger];
