import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutoCategorizePreview, AutoCategorizeResult, CrateProposalDTO } from './model/auto-categorize.model';

@Injectable({
  providedIn: 'root'
})
export class AutoCategorizeService {

  constructor(private http: HttpClient) {}

  /**
   * Preview what crates will be created (dry run)
   */
  preview(): Observable<AutoCategorizePreview> {
    return this.http.get<AutoCategorizePreview>(
      `${environment.baseUri}/v1/auto-categorize/preview`
    );
  }

  /**
   * Execute auto-categorization (create crates)
   * @param proposals Optional pre-computed proposals from preview
   */
  execute(proposals?: CrateProposalDTO[]): Observable<AutoCategorizeResult> {
    const body = proposals ? { proposals } : {};
    return this.http.post<AutoCategorizeResult>(
      `${environment.baseUri}/v1/auto-categorize`,
      body
    );
  }
}
