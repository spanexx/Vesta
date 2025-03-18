import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { map } from 'rxjs';

export const adminGuard = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

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
