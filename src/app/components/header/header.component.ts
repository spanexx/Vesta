import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ThemeService } from '../../services/theme.service';
import { UserProfile } from '../../models/userProfile.model';
import { ProfileService } from '../../services/profile.service';
import { DEFAULT_AVATAR_DIMENSIONS } from '../../utils/image/image-optimization.util';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser$ = this.authService.currentUser$;
  isDarkMode = false;
  isMenuOpen = false;
  user!: UserProfile;
  isFreeProfile = false;
  isCurrentUser = false;
  profile: UserProfile | null = null;
  userProfilePicture: string | null = null;
  headerAvatarDims = DEFAULT_AVATAR_DIMENSIONS.header;
  private subscriptions = new Subscription();
  isLoading = false;

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
    private profileService: ProfileService
  ) {
    this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadUserData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.subscriptions.add(
      this.currentUser$.pipe(take(1)).subscribe(user => {
        if (user) {
          this.user = user;
          this.isFreeProfile = user.profileLevel === 'free';
          this.isCurrentUser = true;
          
          this.subscriptions.add(
            this.profileService.getProfileById(user._id).pipe(take(1)).subscribe({
              next: (profile) => {
                this.profile = profile;
                this.userProfilePicture = profile.profilePicture;
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Failed to load profile:', error);
                this.isLoading = false;
              }
            })
          );
        } else {
          this.isLoading = false;
          this.isCurrentUser = false;
          this.profile = null;
        }
      })
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

  getcurrentUser() {
    this.authService.getCurrentUser().subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.authService.logout();
  }

  onRoleSelect(role: string): void {
    this.isMenuOpen = false;
    this.router.navigate(['/'], { 
      queryParams: { role },
      queryParamsHandling: 'merge',
      skipLocationChange: false,
      replaceUrl: true
    });
  }
}
