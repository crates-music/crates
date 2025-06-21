import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { User } from '../model/user.model';
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

  updateProfile(profileData: { handle?: string | null; bio?: string | null }): Observable<User> {
    return this.http.put(`${environment.baseUri}/v1/user/profile`, profileData)
      .pipe(
        map(response => Object.assign(new User(), response) as User)
      );
  }
}
