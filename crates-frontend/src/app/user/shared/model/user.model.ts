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
  privateProfile?: boolean;
  spotifyUri: string;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
  followerCount?: number;
  followingCount?: number;
  
  get imageUrl(): string | null {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
  }
}
