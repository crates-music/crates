import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page.model';
import { Pageable } from '../model/pageable.model';
import { User } from '../../user/shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';

@Injectable({
  providedIn: 'root'
})
export class DiscoverService {
  private readonly userUrl = `${environment.baseUri}/v1/user`;
  private readonly crateUrl = `${environment.baseUri}/v1/crate`;

  constructor(private http: HttpClient) {}

  // User discovery - we'll need to add this endpoint to the backend later
  searchUsers(search: string, pageable: Pageable): Observable<Page<User>> {
    const params = {
      search,
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'updatedAt,desc'
    };
    return this.http.get<Page<User>>(`${this.userUrl}/search`, { params });
  }

  // Get all public crates - using existing endpoint from backend
  discoverCrates(pageable: Pageable, search?: string): Observable<Page<Crate>> {
    let params: any = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'updatedAt,desc'
    };
    
    if (search) {
      params.search = search;
    }

    // This endpoint returns all public crates - we'll need to add this to backend
    return this.http.get<Page<Crate>>(`${this.crateUrl}/public`, { params });
  }

  // Get user profile by handle or ID
  getUserProfile(identifier: string): Observable<User> {
    return this.http.get<User>(`${this.userUrl}/profile/${identifier}`);
  }

  // Get user's public crates
  getUserPublicCrates(userId: number, pageable: Pageable, search?: string): Observable<Page<Crate>> {
    let params: any = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'updatedAt,desc'
    };
    
    if (search) {
      params.search = search;
    }

    return this.http.get<Page<Crate>>(`${this.userUrl}/${userId}/crates`, { params });
  }
}