import { CrateEvent } from './crate-event.model';
import { Page } from './page.model';

// Type alias for activity items (currently just CrateEvent, but can be extended)
export type ActivityItem = CrateEvent;

// Type alias for activity feed response
export type ActivityFeedResponse = Page<ActivityItem>;

// Activity filter types (for future extensibility)
export enum ActivityFilter {
  ALL = 'ALL',
  FOLLOWING = 'FOLLOWING',
  OWN = 'OWN'
}