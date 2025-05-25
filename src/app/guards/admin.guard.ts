import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { AuthenticationService } from '../services/authentication.service';
import { map, of } from 'rxjs';

export const adminGuard = () => {
  const adminService = inject(AdminService);
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  // First check if the user is logged in via the auth service
  if (authService.isAdmin()) {
    return of(true);
  }

  // Fall back to admin service if not found in auth service
  return adminService.currentAdmin$.pipe(
    map(admin => {
      if (admin) {
        return true;
      }
      router.navigate(['/admin/login']);
      return false;
    })
  );
};
