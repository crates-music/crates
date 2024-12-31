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
}
