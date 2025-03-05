import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { map } from 'rxjs';

export const authGuard = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (user) {
        return true;
      }
      
      // Redirect to login if not authenticated
      router.navigate(['/login']);
      return false;
    })
  );
};
