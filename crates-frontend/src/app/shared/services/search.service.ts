import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pageable } from '../model/pageable.model';
import { UnifiedSearchResponse } from '../model/unified-search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly baseUrl = `${environment.baseUri}/v1/search`;

  constructor(private http: HttpClient) {}

  search(query: string, pageable: Pageable): Observable<UnifiedSearchResponse> {
    const params = {
      q: query,
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString()
    };
    return this.http.get<UnifiedSearchResponse>(this.baseUrl, { params });
  }
}