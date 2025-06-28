import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page.model';
import { Pageable } from '../model/pageable.model';
import { User } from '../../user/shared/model/user.model';
import { UserFollow } from '../model/user-follow.model';
import { SocialStats, FollowStatus } from '../model/social-stats.model';

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private readonly baseUrl = `${environment.baseUri}/v1/social`;

  constructor(private http: HttpClient) {}

  // Following functionality
  followUser(userId: number): Observable<UserFollow> {
    return this.http.post<UserFollow>(`${this.baseUrl}/follow/${userId}`, {});
  }

  unfollowUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/follow/${userId}`);
  }

  getFollowStatus(userId: number): Observable<FollowStatus> {
    return this.http.get<FollowStatus>(`${this.baseUrl}/follow/${userId}/status`);
  }

  // Get social relationships
  getFollowing(pageable: Pageable): Observable<Page<UserFollow>> {
    const params = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'createdAt,desc'
    };
    return this.http.get<Page<UserFollow>>(`${this.baseUrl}/following`, { params });
  }

  getFollowers(pageable: Pageable): Observable<Page<UserFollow>> {
    const params = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'createdAt,desc'
    };
    return this.http.get<Page<UserFollow>>(`${this.baseUrl}/followers`, { params });
  }

  // Social stats
  getSocialStats(): Observable<SocialStats> {
    return this.http.get<SocialStats>(`${this.baseUrl}/stats`);
  }

  getUserSocialStats(userId: number): Observable<SocialStats> {
    return this.http.get<SocialStats>(`${this.baseUrl}/user/${userId}/stats`);
  }

  isFollowing(userId: number): Observable<boolean> {
    return this.http.get<FollowStatus>(`${this.baseUrl}/follow/${userId}/status`)
      .pipe(map(status => status.isFollowing));
  }

  // User search functionality
  searchUsers(search: string, pageable: Pageable): Observable<Page<User>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', pageable.pageNumber.toString())
      .set('size', pageable.pageSize.toString())
      .set('sort', 'updatedAt,desc');
    
    return this.http.get<Page<User>>(`${environment.baseUri}/v1/user/search`, { params });
  }
}