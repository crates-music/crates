import { ActionReducer } from '@ngrx/store';

const ignoredActions: any[] = [];

export function logger(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state: any, action: any): any => {
    const result = reducer(state, action);
    // Exclude noisy actions
    const matchesExcludedAction = ignoredActions.some(ignore => action instanceof ignore);
    if (!matchesExcludedAction) {
      console.groupCollapsed(action.type);
      console.log('prev state', state);
      console.log('action', action);
      console.log('next state', result);
      console.groupEnd();
    }

    return result;
  };
}
