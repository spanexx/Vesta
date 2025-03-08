import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  currentUser$ = this.authService.currentUser$;
  isDarkMode = false;
  isMenuOpen = false;

  roles = [
    { value: 'girlfriend', label: 'Girlfriend' },
    { value: 'wife', label: 'Wife' },
    { value: 'mistress', label: 'Mistress' },
    { value: 'pornstar', label: 'Pornstar' },
    { value: 'onenight', label: 'One Night' }
  ];

  constructor(
    private authService: AuthenticationService,
    private themeService: ThemeService,
    private router: Router  // Add router
  ) {
    this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  onRoleSelect(role: string): void {
    this.router.navigate(['/'], { 
      queryParams: { role },
      queryParamsHandling: 'merge'
    });
  }
}
