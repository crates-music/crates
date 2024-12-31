import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  setToken(token: string): void {
    localStorage.setItem('crate-token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('crate-token');
  }

  logout(): void {
    localStorage.removeItem('crate-token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('crate-token');
  }
}
