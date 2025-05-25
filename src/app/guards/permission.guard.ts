import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { AdminService } from '../services/admin.service';
import { map, of } from 'rxjs';

// Define an interface for admin permissions with index signature
interface AdminPermissions {
  canEditProfiles?: boolean;
  canDeleteProfiles?: boolean;
  canModerateContent?: boolean;
  canManageSubscriptions?: boolean;
  canCreateAdmin?: boolean;
  [key: string]: boolean | undefined; // Add index signature
}

/**
 * Guard that specifically checks for admin permissions
 * @param requiredPermission The admin permission to check (e.g., 'canEditProfiles', 'canDeleteProfiles')
 * @returns A guard function that returns true if the user has the required admin permission
 */
export const permissionGuard = (requiredPermission: string) => {
  const adminService = inject(AdminService);
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  // Check if admin via the auth service
  if (authService.isAdmin()) {
    const permissions = authService.getAdminPermissions() as AdminPermissions;
    if (permissions && permissions[requiredPermission] === true) {
      return of(true);
    }
  }
  // Fall back to admin service for permissions check
  return adminService.currentAdmin$.pipe(
    map(admin => {
      if (admin && admin.permissions) {
        // Cast admin.permissions to AdminPermissions to use the index signature
        const adminPermissions = admin.permissions as AdminPermissions;
        if (adminPermissions[requiredPermission] === true) {
          return true;
        }
      }
      
      // Redirect to unauthorized page if they don't have permission
      router.navigate(['/admin/unauthorized']);
      return false;
    })
  );
};
