import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { User } from '../model/user.model';
import { Page } from '../../../shared/model/page.model';
import { Crate } from '../../../crate/shared/model/crate.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {
  }

  getUser(): Observable<User> {
    return this.http.get(`${environment.baseUri}/v1/user/current`)
      .pipe(
        map(response => Object.assign(new User(), response) as User)
      );
  }

  updateProfile(profileData: { handle?: string | null; bio?: string | null; privateProfile?: boolean }): Observable<User> {
    return this.http.put(`${environment.baseUri}/v1/user/profile`, profileData)
      .pipe(
        map(response => Object.assign(new User(), response) as User)
      );
  }

  getCurrentUser(): Observable<User | null> {
    return this.getUser();
  }

  getUserByHandle(handle: string): Observable<User> {
    return this.http.get(`${environment.baseUri}/v1/user/handle/${handle}`)
      .pipe(
        map(response => Object.assign(new User(), response) as User)
      );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get(`${environment.baseUri}/v1/user/${userId}`)
      .pipe(
        map(response => Object.assign(new User(), response) as User)
      );
  }

  getUserPublicCrates(userId: number, search?: string): Observable<Page<Crate>> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<Page<Crate>>(`${environment.baseUri}/v1/user/${userId}/crates`, { params });
  }

  getUserPublicCollection(userId: number, search?: string): Observable<Page<Crate>> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<Page<Crate>>(`${environment.baseUri}/v1/user/${userId}/collection`, { params });
  }
}
