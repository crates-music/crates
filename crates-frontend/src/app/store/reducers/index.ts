import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { logger } from './logger.reducer';
import * as fromUser from '../../user/store/reducers/user.reducer';
import * as fromLibrary from '../../library/store/reducers/library.reducer';
import * as fromCrate from '../../crate/store/reducers/crate.reducer';

export interface State {
  user: fromUser.UserState,
  library: fromLibrary.LibraryState
  crate: fromCrate.CrateState
}

export const reducers: ActionReducerMap<State> = {
  user: fromUser.reducer,
  library: fromLibrary.reducer,
  crate: fromCrate.reducer,
};

// export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
//   return localStorageSync({
//     keys: ['account', 'navigation', 'crates'],
//     rehydrate: true,
//   })(reducer);
// }

export const metaReducers: MetaReducer<any, any>[] =
  !environment.production ? [] : [logger];
