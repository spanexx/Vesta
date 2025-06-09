import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AdminService } from "../services/admin.service";
import { Observable, throwError } from "rxjs";
import { catchError } from 'rxjs/operators';
import { Router } from "@angular/router";

export function adminInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const adminService = inject(AdminService);
  const router = inject(Router);
  const token = adminService.getToken();
  console.log('Admin interceptor', token);
    // Only add token for admin API requests and performance API requests (which require admin auth)
  if ((req.url.includes('/api/admin') || req.url.includes('/api/performance')) && token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        adminService.logout();
        router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    })
  );
}
