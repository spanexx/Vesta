import { Component, ElementRef, HostListener } from '@angular/core';
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
    { value: 'onenight', label: 'OneNight' }
  ];

  constructor(
    private authService: AuthenticationService,
    private themeService: ThemeService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  onRoleSelect(role: string): void {
    this.isMenuOpen = false; // Close menu after selection
    // First navigate to home, then set query params
    this.router.navigate(['/'], { 
      queryParams: { role },
      queryParamsHandling: 'merge',
      // Add these options to force route reload
      skipLocationChange: false,
      replaceUrl: true
    });
  }
}
