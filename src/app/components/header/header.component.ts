import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ThemeService } from '../../services/theme.service';
import { UserProfile } from '../../models/userProfile.model';
import { ProfileService } from '../../services/profile.service';
import { DEFAULT_AVATAR_DIMENSIONS } from '../../utils/image/image-optimization.util';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentUser$ = this.authService.currentUser$;
  isDarkMode = false;
  isMenuOpen = false;
  user!: UserProfile;
  isFreeProfile = false; // Add this property
  isCurrentUser = false; // Add this property
  profile: UserProfile | null = null;
  userProfilePicture: string | null = null;
  headerAvatarDims = DEFAULT_AVATAR_DIMENSIONS.header;

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
    private elementRef: ElementRef,
    private profileService: ProfileService  // Add this
  ) {
    this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  ngOnInit() {

    this.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.isFreeProfile = user.profileLevel === 'free';
        // console.log('User profile level:', user);
      }
      
    });

    this.authService.currentUser$.subscribe(currentUser => {

      if (currentUser) {
        this.isCurrentUser = true;
      }

  });

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileService.getProfileById(user._id).subscribe({
          next: (profile) => {
            this.profile = profile;
            this.userProfilePicture = profile.profilePicture;
          },
          error: (error) => {
            console.error('Failed to load profile:', error);
          }
        });
      } else {
        this.profile = null;
      }
    });
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

  getcurrentUser() {
    this.authService.getCurrentUser().subscribe(user => {
      this.user = user;
    });
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
