import { Image } from '../../../library/shared/model/image.model';

export class User {
  id: number;
  spotifyId: string;
  userId: string;
  href: string;
  displayName: string;
  email: string;
  handle?: string;
  bio?: string;
  spotifyUri: string;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
}
