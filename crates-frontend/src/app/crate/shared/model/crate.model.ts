import { User } from '../../../user/shared/model/user.model';

export class Crate {
  id: number;
  name: string;
  handle: string;
  createdAt: Date;
  updatedAt: Date;
  state: string;
  imageUri: string;
  publicCrate: boolean;
  description: string;
  followerCount: number;
  user: User; // The author/owner of the crate
  albumCount?: number;
  isInUserCollection?: boolean;
  collected: boolean;
}
