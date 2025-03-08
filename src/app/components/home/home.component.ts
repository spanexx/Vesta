import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProfileService, LocationFilter, ProfileQueryParams } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { CustomSpinnerComponent } from '../../custom-spinner/custom-spinner.component';
import { FilterPipe } from '../../pipes/filter.pipe';
import { calculateDistance } from '../../utils/distance.util';
import { LocationFilterComponent } from '../location-filter/location-filter.component';

type ProfileLevel = 'vip' | 'premium' | 'standard' | 'basic';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomSpinnerComponent,
    // FilterPipe,
    LocationFilterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  userProfiles: UserProfile[] = [];
  isLoading = false;
  error: string | null = null;
  locationError: string | null = null;
  private queryParamsSub?: Subscription;
  userLocation: [number, number] | undefined = undefined;  // Changed from null to undefined
  currentFilter: LocationFilter = {};
  isUsingLocation = false;  // Add this property
  showFilters = false;

  // Add missing properties
  selectedAge?: number;
  selectedServices?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for saved location when component initializes
    const savedLocation = sessionStorage.getItem('userLocation');
    if (savedLocation) {
      const { coordinates, timestamp } = JSON.parse(savedLocation);
      const fiveMinutes = 5 * 60 * 1000;
      
      // Use saved location if it's less than 5 minutes old
      if (Date.now() - timestamp < fiveMinutes) {
        this.userLocation = coordinates;
        const params: ProfileQueryParams = {
          coordinates: this.userLocation,
          age: this.selectedAge,
          services: this.selectedServices?.join(',')
        };
        this.fetchProfiles(params);
        return;
      } else {
        sessionStorage.removeItem('userLocation');
      }
    }

    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      this.currentFilter = {
        country: params['country'],
        city: params['city']
      };
      this.loadProfiles();
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  // Handle filter component events
  onFilterChange(filter: LocationFilter): void {
    this.updateUrlParams(filter);
  }

  onLocationRequest(): void {
    // First toggle the flag
    this.isUsingLocation = !this.isUsingLocation;
    
    if (!this.isUsingLocation) {
      // When disabling location, clear location data
      this.userLocation = undefined;
      sessionStorage.removeItem('userLocation');
      // Update URL to remove location param
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { useLocation: null },
        queryParamsHandling: 'merge'
      }).then(() => {
        // Load profiles without location after URL update
        this.loadProfiles(false);
      });
      return;
    }

    // When enabling location
    if ('geolocation' in navigator) {
      this.isLoading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          this.userLocation = coordinates;
          
          // Store location in session storage
          sessionStorage.setItem('userLocation', JSON.stringify({
            coordinates,
            timestamp: Date.now()
          }));

          // Update URL with location flag
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { useLocation: 'true' },
            queryParamsHandling: 'merge'
          }).then(() => {
            // Load profiles with location after URL update
            const params: ProfileQueryParams = {
              coordinates: this.userLocation,
              age: this.selectedAge,
              services: this.selectedServices?.join(',')
            };
            this.fetchProfiles(params);
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.locationError = 'Could not get your location. Please check your browser settings and try again.';
          this.isLoading = false;
          this.isUsingLocation = false; // Reset the toggle on error
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      this.locationError = 'Geolocation is not supported by your browser.';
      this.isUsingLocation = false; // Reset the toggle if geolocation not supported
      this.isLoading = false;
    }
  }

  onClearFilters(): void {
    this.router.navigate(['/']);
  }

  private updateUrlParams(params: LocationFilter): void {
    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    );

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams,
      queryParamsHandling: 'merge'
    });
  }

  public loadProfiles(useLocation: boolean = false): void {
    this.isLoading = true;
    this.error = null;
    this.locationError = null;

    // Check if we already have valid location data
    const savedLocation = sessionStorage.getItem('userLocation');
    if (useLocation && savedLocation) {
      const { coordinates, timestamp } = JSON.parse(savedLocation);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (Date.now() - timestamp < fiveMinutes) {
        this.userLocation = coordinates;
        const params: ProfileQueryParams = {
          coordinates: this.userLocation,
          age: this.selectedAge,
          services: this.selectedServices?.join(',')
        };
        this.fetchProfiles(params);
        return;
      }
    }

    if (useLocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentFilter = {};
            const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
            this.userLocation = coordinates;
            
            const params: ProfileQueryParams = {
              coordinates: this.userLocation,  // Now this will match the expected type
              age: this.selectedAge,
              services: this.selectedServices?.join(',')
            };

            // Store location in session storage
            sessionStorage.setItem('userLocation', JSON.stringify({
              coordinates,
              timestamp: Date.now()
            }));

            // Update URL and fetch profiles
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { useLocation: 'true' },
              queryParamsHandling: 'merge'
            });

            this.fetchProfiles(params);
          },
          (error) => {
            console.error('Geolocation error:', error);
            this.locationError = 'Could not get your location. Please check your browser settings and try again.';
            this.isLoading = false;
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // Cache location for 5 minutes
          }
        );
      } else {
        this.locationError = 'Geolocation is not supported by your browser.';
        this.isLoading = false;
      }
    } else {
      if (!this.currentFilter.country && !this.currentFilter.city) {
        this.fetchProfiles();
      } else {
        this.profileService.filterByLocation(this.currentFilter).subscribe({
          next: (profiles) => {
            this.userProfiles = profiles;
            this.isLoading = false;
          },
          error: (error) => this.handleError(error)
        });
      }
    }
  }

  // Add new helper method
  private fetchProfiles(params?: ProfileQueryParams): void {
    this.isLoading = true;
    this.error = null;
    
    this.profileService.getAllProfiles(params).subscribe({
      next: (profiles: UserProfile[]) => {
        if (params?.coordinates && profiles.length > 0) {
          this.userProfiles = this.sortProfilesByDistanceAndStatus(
            profiles, 
            params.coordinates as [number, number]
          );
        } else {
          this.userProfiles = profiles;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private sortProfilesByDistanceAndStatus(
    profiles: UserProfile[],
    userLocation: [number, number]
  ): UserProfile[] {
    return profiles.sort((a, b) => {
      // First, sort by profile level using type-safe mapping
      const levels: Record<ProfileLevel, number> = {
        vip: 3,
        premium: 2,
        standard: 1,
        basic: 0
      };
      
      const levelA = (a.profileLevel as ProfileLevel) || 'basic';
      const levelB = (b.profileLevel as ProfileLevel) || 'basic';
      
      const levelDiff = levels[levelB] - levels[levelA];
      
      if (levelDiff !== 0) return levelDiff;

      // Then, sort by distance if coordinates are available
      const coordsA = this.getCoordinates(a);
      const coordsB = this.getCoordinates(b);
      if (coordsA && coordsB) {
        const distanceA = this.calculateDistance(userLocation, coordsA);
        const distanceB = this.calculateDistance(userLocation, coordsB);
        return distanceA - distanceB;
      }
      
      return 0;
    });
  }

  private handleError(error: any): void {
    this.error = 'Failed to load profiles. Please try again later.';
    this.isLoading = false;
    console.error('Profile loading error:', error);
  }

  // Add helper method to safely get coordinates
  getCoordinates(profile: UserProfile): [number, number] | null {
    if (profile.contact?.location?.coordinates && 
        Array.isArray(profile.contact.location.coordinates) && 
        profile.contact.location.coordinates.length === 2) {
      return profile.contact.location.coordinates as [number, number];
    }
    return null;
  }

  // Update calculateDistance to handle null values
  calculateDistance(coords1: [number, number] | null, coords2: [number, number] | null): number {
    if (!coords1 || !coords2) return 0;
    return calculateDistance(coords1, coords2);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    // Toggle body scroll when filters are shown
    document.body.style.overflow = this.showFilters ? 'hidden' : '';
    
    // Toggle overlay
    const overlay = document.querySelector('.filters-overlay');
    if (overlay) {
      overlay.classList.toggle('show', this.showFilters);
    }
  }
}