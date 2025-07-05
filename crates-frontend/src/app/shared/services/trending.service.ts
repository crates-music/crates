import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page.model';
import { Pageable } from '../model/pageable.model';
import { Crate } from '../../crate/shared/model/crate.model';

@Injectable({
  providedIn: 'root'
})
export class TrendingService {
  private readonly publicUrl = `${environment.baseUri}/v1/public`;

  constructor(private http: HttpClient) {}

  getTrendingCrates(pageable: Pageable): Observable<Page<Crate>> {
    const params = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString()
    };
    
    return this.http.get<Page<Crate>>(`${this.publicUrl}/crates/trending`, { params });
  }

  getRecentCrates(pageable: Pageable): Observable<Page<Crate>> {
    const params = {
      sort: 'updatedAt,desc',
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString()
    };
    
    return this.http.get<Page<Crate>>(`${this.publicUrl}/crates`, { params });
  }

  recordCrateView(crateId: number): Observable<void> {
    return this.http.post<void>(`${this.publicUrl}/crate/${crateId}/view`, {});
  }
}