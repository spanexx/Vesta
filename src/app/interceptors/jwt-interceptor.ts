import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthenticationService } from "../services/authentication.service";
import { Observable, throwError } from "rxjs";
import { catchError } from 'rxjs/operators';

export function jwtInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const authService = inject(AuthenticationService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
}