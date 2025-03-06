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
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  userProfiles: UserProfile[] = [];
  isLoading = false;
  error: string | null = null;
  locationError: string | null = null;
  private queryParamsSub?: Subscription;
  userLocation: [number, number] | null = null;

  currentFilter: LocationFilter = {};

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
    this.loadProfiles(true);
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

    if (useLocation) {
      // Get user's geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Clear any existing filters when using location
            this.currentFilter = {};
            
            this.userLocation = [position.coords.longitude, position.coords.latitude];
            
            const params: ProfileQueryParams = {
              coordinates: this.userLocation
            };
            
            // Update URL to reflect we're using location-based search
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { useLocation: 'true' },
              queryParamsHandling: 'merge'
            });

            // Get profiles based on location
            this.profileService.getAllProfiles(params).subscribe({
              next: (profiles) => {
                // Sort profiles by distance and VIP status
                this.userProfiles = this.sortProfilesByDistanceAndStatus(
                  profiles,
                  this.userLocation!
                );
                this.isLoading = false;
              },
              error: (error) => this.handleError(error)
            });
          },
          (error) => {
            this.locationError = 'Could not get your location. Please check your browser settings and try again.';
            this.isLoading = false;
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        this.locationError = 'Geolocation is not supported by your browser.';
        this.isLoading = false;
      }
    } else {
      // Existing filter-based search logic
      if (!this.currentFilter.country && !this.currentFilter.city) {
        this.profileService.getAllProfiles().subscribe({
          next: (profiles) => {
            this.userProfiles = profiles;
            this.isLoading = false;
          },
          error: (error) => this.handleError(error)
        });
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
}