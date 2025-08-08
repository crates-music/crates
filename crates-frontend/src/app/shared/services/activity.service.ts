import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page.model';
import { Pageable } from '../model/pageable.model';
import { CrateEvent } from '../model/crate-event.model';
import { ActivityFeedResponse } from '../model/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly baseUrl = `${environment.baseUri}/v1/feed`;

  constructor(private http: HttpClient) {}

  // Get activity feed with pagination
  getFeed(pageable: Pageable): Observable<ActivityFeedResponse> {
    const params = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'createdAt,desc'
    };
    return this.http.get<ActivityFeedResponse>(`${this.baseUrl}`, { params });
  }

  // Get feed events since a specific timestamp (for refresh/new content detection)
  getFeedSince(timestamp: Date): Observable<CrateEvent[]> {
    const params = new HttpParams()
      .set('since', timestamp.toISOString());
    return this.http.get<CrateEvent[]>(`${this.baseUrl}/since`, { params });
  }

  // Get feed events before a specific timestamp (for infinite scroll)
  getFeedBefore(timestamp: Date, size: number = 20): Observable<CrateEvent[]> {
    const params = new HttpParams()
      .set('before', timestamp.toISOString())
      .set('size', size.toString());
    return this.http.get<CrateEvent[]>(`${this.baseUrl}/before`, { params });
  }

  // Check if there are new events since a timestamp
  hasNewEvents(timestamp: Date): Observable<boolean> {
    const params = new HttpParams()
      .set('since', timestamp.toISOString());
    return this.http.get<boolean>(`${this.baseUrl}/has-new`, { params });
  }
}