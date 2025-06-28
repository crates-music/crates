import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page.model';
import { Pageable } from '../model/pageable.model';
import { Crate } from '../../crate/shared/model/crate.model';
import { CollectionStatus, CollectionResponse } from '../model/social-stats.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private readonly baseUrl = `${environment.baseUri}/v1/crate`;

  constructor(private http: HttpClient) {}

  // Collection management
  addCrateToCollection(crateId: number): Observable<CollectionResponse> {
    return this.http.post<CollectionResponse>(`${this.baseUrl}/${crateId}/collection`, {});
  }

  removeCrateFromCollection(crateId: number): Observable<CollectionResponse> {
    return this.http.delete<CollectionResponse>(`${this.baseUrl}/${crateId}/collection`);
  }

  getCollectionStatus(crateId: number): Observable<CollectionStatus> {
    return this.http.get<CollectionStatus>(`${this.baseUrl}/${crateId}/collection/status`);
  }

  // Get user's collection
  getMyCollection(pageable: Pageable, search?: string): Observable<Page<Crate>> {
    let params: any = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'createdAt,desc'
    };
    
    if (search) {
      params.search = search;
    }

    return this.http.get<Page<Crate>>(`${this.baseUrl}/collection`, { params });
  }
}