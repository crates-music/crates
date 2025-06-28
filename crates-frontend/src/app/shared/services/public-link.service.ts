import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../../user/shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';

@Injectable({
  providedIn: 'root'
})
export class PublicLinkService {

  /**
   * Get the public profile URL for a user
   * @param user The user object
   * @returns The public profile URL
   */
  getProfileUrl(user: User): string {
    const username = user.handle || user.spotifyId;
    return `${environment.publicBaseUrl}/${username}`;
  }

  /**
   * Get the public crate URL for a user's crate
   * @param user The user object
   * @param crate The crate object
   * @returns The public crate URL
   */
  getCrateUrl(user: User, crate: Crate): string {
    const username = user.handle || user.spotifyId;
    return `${environment.publicBaseUrl}/${username}/${crate.handle}`;
  }

  /**
   * Get the public collection crate URL for a crate in a user's collection
   * @param collectorUser The user who has the crate in their collection
   * @param crate The crate object
   * @returns The public collection crate URL
   */
  getCollectionCrateUrl(collectorUser: User, crate: Crate): string {
    const username = collectorUser.handle || collectorUser.spotifyId;
    return `${environment.publicBaseUrl}/${username}/collection/${crate.handle}`;
  }

  /**
   * Open a URL in a new tab/window
   * @param url The URL to open
   */
  openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}