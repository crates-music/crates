import { User } from '../../user/shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';
import { Album } from '../../library/shared/model/album.model';

export enum CrateEventType {
  CRATE_RELEASED = 'CRATE_RELEASED',
  ALBUM_ADDED = 'ALBUM_ADDED',
  CRATE_ADDED_TO_COLLECTION = 'CRATE_ADDED_TO_COLLECTION',
  USER_FOLLOWED = 'USER_FOLLOWED'
}

export class CrateEvent {
  id: number;
  user: User;
  crate: Crate;
  followedUser: User;
  eventType: CrateEventType;
  albumIds: number[];
  albums: Album[]; // Album details for ALBUM_ADDED events
  createdAt: Date;
}