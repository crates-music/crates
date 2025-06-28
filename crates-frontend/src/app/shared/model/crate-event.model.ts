import { User } from '../../user/shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';

export enum CrateEventType {
  CRATE_RELEASED = 'CRATE_RELEASED',
  ALBUM_ADDED = 'ALBUM_ADDED',
  CRATE_ADDED_TO_COLLECTION = 'CRATE_ADDED_TO_COLLECTION'
}

export class CrateEvent {
  id: number;
  user: User;
  crate: Crate;
  eventType: CrateEventType;
  albumIds: number[];
  createdAt: Date;
}