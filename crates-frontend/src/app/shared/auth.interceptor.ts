import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService,
              private router: Router) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const tokenReq = request.clone({
      setHeaders: {
        'x-crates-auth-token': this.authService.getToken()!,
      }
    })
    return next.handle(tokenReq).pipe(
      tap({
        error: (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status !== 401) {
              return;
            }
            this.authService.logout();
            this.router.navigate(['/auth', 'login']);
          }
        }
      })
    );
  }
}
