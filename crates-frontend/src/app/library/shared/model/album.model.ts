import { Image } from './image.model';
import { Artist } from './artist.model';

export class Album {
  id: number;
  spotifyId: string;
  href: string;
  uri: string;
  name: string;
  popularity: number;
  releaseDate: Date;
  artists: Artist[] = [];
  images: Image[] = [];

  // UI properties
  selected = false;

  get imageUrl(): string | null {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
  }
}
