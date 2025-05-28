import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { ProfileService, LocationFilter, ProfileQueryParams, PaginatedProfileResponse, PaginationInfo } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { FilterPipe } from '../../pipes/filter.pipe';
import { calculateDistance } from '../../utils/distance.util';
import { LocationFilterComponent } from '../location-filter/location-filter.component';
import { BehaviorSubject, Observable, combineLatest, Subject } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged, tap, takeUntil } from 'rxjs/operators';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CacheService } from '../../services/cache.service';
import { FileUploadService } from '../../services/file-upload.service';
import { FilterComponent } from '../filter/filter.component';

// Import FilterData interface for type safety
interface FilterData {
  username?: string;
  physicalAttribute?: {attribute: string, value: any} | null;
}

type ProfileLevel = 'vip' | 'premium' | 'standard' | 'basic';
type Coordinates = [number, number];

@Component({
  selector: 'app-home',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ScrollingModule,
    LocationFilterComponent,
    FilterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();
  private filterSubject = new BehaviorSubject<LocationFilter>({});
  private locationSubject = new BehaviorSubject<Coordinates | undefined>(undefined);
  private destroy$ = new Subject<void>();
  public profilesCache = new BehaviorSubject<UserProfile[]>([]);

  userProfiles$ = this.initializeDataStream();

  userProfiles: UserProfile[] = [];
  isLoading = false;
  error: string | null = null;
  locationError: string | null = null;
  private queryParamsSub?: Subscription;
  userLocation: Coordinates | undefined = undefined;  // Changed from null to undefined
  currentFilter: LocationFilter = {};
  isUsingLocation = false;  // Add this property
  showFilters = false;
  // Add missing properties
  selectedAge?: number;
  selectedServices?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };  public allProfiles: UserProfile[] = [];
  private physicalFilter: {attribute: string, value: any} | null = null;  private usernameFilter: string = '';
  private combinedFilters: FilterData = {};  public selectedGender: 'female' | 'male' | 'trans' | null = null;

  // Pagination properties
  public currentPage = 1;
  public pageSize = 20;
  public pagination: PaginationInfo | null = null;
  public isLoadingMore = false;

  // Template helpers
  public Math = Math;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private cacheService: CacheService,
    public fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.initializeLocation();
    
    // Improve route parameter handling
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      tap(([params, queryParams]) => {
        this.isLoading = true;
        
        // Update filter
        this.currentFilter = {
          country: queryParams['country'],
          city: queryParams['city']
        };
      }),      switchMap(([_, queryParams]) => {
        if (queryParams['role']) {
          return this.profileService.filterByRole(queryParams['role']).pipe(
            map(profiles => ({ profiles, pagination: null }))
          );
        }
        if (queryParams['country'] || queryParams['city']) {
          return this.profileService.filterByLocation({
            country: queryParams['country'],
            city: queryParams['city']
          }).pipe(
            map(profiles => ({ profiles, pagination: null }))
          );
        }
        // Pass query parameters to getAllProfiles
        return this.profileService.getAllProfiles({
          ...queryParams,
          coordinates: this.userLocation,
          page: this.currentPage,
          limit: this.pageSize
        });
      })    ).subscribe({
      next: (response) => {        
        if ('profiles' in response) {
          // Paginated response
          this.allProfiles = response.profiles;
          this.userProfiles = response.profiles;
          this.pagination = response.pagination;
        } else {
          // Non-paginated response (from filterByRole or filterByLocation)
          this.allProfiles = response as UserProfile[];
          this.userProfiles = response as UserProfile[];
          this.pagination = null;
        }
        this.profilesCache.next(this.userProfiles);
        this.isLoading = false;
        // Re-apply filters on new data
        this.applyAllFilters();
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }

  private initializeDataStream(): Observable<UserProfile[]> {
    return this.profilesCache.asObservable().pipe(
      map(profiles => {
        console.log('Processing profiles stream:', profiles.length);
        return this.sortProfilesByDistanceAndStatus(profiles, this.userLocation);
      })
    );
  }

  private initializeLocation(): void {
    const savedLocation = sessionStorage.getItem('userLocation');
    if (savedLocation) {
      const { coordinates, timestamp } = JSON.parse(savedLocation);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        this.locationSubject.next(coordinates);
        return;
      }
    }
    this.requestLocation();
  }

  private requestLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: Coordinates = [
            position.coords.longitude,
            position.coords.latitude
          ];
          this.locationSubject.next(coordinates);
          sessionStorage.setItem('userLocation', JSON.stringify({
            coordinates,
            timestamp: Date.now()
          }));
        },
        (error) => {
          this.locationSubject.next(undefined);
          this.locationError = 'Could not get your location.';
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle filter component events
  onFilterChange(filter: LocationFilter): void {
    this.updateUrlParams(filter);
  }
  onLocationRequest(): void {
    // Reset pagination when changing location settings
    this.resetPagination();
    
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
      
      if (Date.now() - timestamp < fiveMinutes) {        this.userLocation = coordinates;
        const params: ProfileQueryParams = {
          coordinates: this.userLocation,
          age: this.selectedAge,
          services: this.selectedServices?.join(','),
          page: this.currentPage,
          limit: this.pageSize
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
              services: this.selectedServices?.join(','),
              page: this.currentPage,
              limit: this.pageSize
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
      }    } else {
      if (!this.currentFilter.country && !this.currentFilter.city) {
        this.fetchProfiles({
          page: this.currentPage,
          limit: this.pageSize
        });      } else {
        this.profileService.filterByLocation(this.currentFilter).subscribe({
          next: (profiles) => {
            this.allProfiles = profiles;
            this.userProfiles = profiles;
            this.applyAllFilters();
            this.isLoading = false;
          },
          error: (error) => this.handleError(error)
        });
      }
    }
  }  // Add new helper method
  private fetchProfiles(params?: ProfileQueryParams): void {
    this.isLoading = true;
    this.error = null;
    
    this.profileService.getAllProfiles(params).subscribe({      
      next: (response: PaginatedProfileResponse) => {
        console.log('Fetched profiles:', response.profiles.length); // Debug log
        this.allProfiles = response.profiles;
        this.pagination = response.pagination;
        if (params?.coordinates && response.profiles.length > 0) {
          this.userProfiles = this.sortProfilesByDistanceAndStatus(
            response.profiles, 
            params.coordinates as [number, number]
          );
        } else {
          this.userProfiles = response.profiles;
        }
        
        // Don't apply local filters when using pagination - server handles filtering
        // Only apply filters if we're not using pagination (pagination is null)
        if (!this.pagination) {
          this.applyAllFilters();
        }
        
        this.profilesCache.next(this.userProfiles);
        this.loadingSubject.next(false);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching profiles:', error); // Debug log
        this.handleError(error);
        this.loadingSubject.next(false);
        this.isLoading = false;
      }
    });
  }

  private sortProfilesByDistanceAndStatus(
    profiles: UserProfile[],
    userLocation?: Coordinates
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
      if (userLocation) {
        const coordsA = this.getCoordinates(a);
        const coordsB = this.getCoordinates(b);
        if (coordsA && coordsB) {
          const distanceA = this.calculateDistance(userLocation, coordsA);
          const distanceB = this.calculateDistance(userLocation, coordsB);
          return distanceA - distanceB;
        }
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
  public getCoordinates(profile: UserProfile): Coordinates | undefined {
    if (profile.contact?.location?.coordinates && 
        Array.isArray(profile.contact.location.coordinates) && 
        profile.contact.location.coordinates.length === 2) {
      return profile.contact.location.coordinates as Coordinates;
    }
    return undefined;
  }

  // Update calculateDistance to handle null values
  calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
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
  }  onPhysicalFilterChange(filterData: FilterData) {
    // Reset pagination when filters change
    this.resetPagination();
    
    // Update combined filters
    this.combinedFilters = { ...filterData };
    
    // Update individual filters for compatibility
    this.usernameFilter = filterData.username || '';
    this.physicalFilter = filterData.physicalAttribute || null;
    
    // Apply all filters
    this.applyAllFilters();
  }
  // Method to clear all filters
  clearAllFilters() {
    this.usernameFilter = '';
    this.physicalFilter = null;
    this.selectedGender = null;
    this.combinedFilters = {};
    this.userProfiles = [...this.allProfiles];
  }
  // Method to get current active filters count for UI feedback
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.usernameFilter?.trim()) count++;
    if (this.physicalFilter) count++;
    if (this.selectedGender) count++;
    return count;
  }
  // Gender filtering methods
  filterByGender(gender: 'female' | 'male' | 'trans') {
    this.resetPagination();
    this.selectedGender = gender;
    this.applyGenderFilter();
  }

  clearGenderFilter() {
    this.resetPagination();
    this.selectedGender = null;
    this.applyGenderFilter();
  }

  getGenderCount(gender: 'female' | 'male' | 'trans'): number {
    return this.allProfiles.filter(profile => 
      profile.physicalAttributes?.gender === gender
    ).length;
  }
  private applyGenderFilter() {
    // Simply trigger the unified filter application
    this.applyAllFilters();
  }private applyAllFilters() {
    let filteredProfiles = [...this.allProfiles];

    // Apply gender filter first if selected
    if (this.selectedGender) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.physicalAttributes?.gender === this.selectedGender
      );
    }

    // Early return if no other filters are active
    if (!this.usernameFilter?.trim() && !this.physicalFilter) {
      this.userProfiles = filteredProfiles;
      return;
    }

    // Apply username filter
    if (this.usernameFilter && this.usernameFilter.trim()) {
      const searchTerm = this.usernameFilter.trim().toLowerCase();
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.username?.toLowerCase().includes(searchTerm) ||
        profile.fullName?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply physical attribute filter
    if (this.physicalFilter) {
      filteredProfiles = filteredProfiles.filter(profile => 
        this.matchesPhysicalFilter(profile, this.physicalFilter!)
      );
    }

    this.userProfiles = filteredProfiles;
  }
  private matchesPhysicalFilter(profile: UserProfile, filter: {attribute: string, value: any}): boolean {
    if (!profile.physicalAttributes) return false;

    const { attribute, value } = filter;
    
    switch (attribute) {
      case 'height':
        const height = profile.physicalAttributes.height;
        const heightRange = value as { min: number | null, max: number | null };
        if (!height) return false;
        if (heightRange.min && height < heightRange.min) return false;
        if (heightRange.max && height > heightRange.max) return false;
        return true;

      case 'weight':
        const weight = profile.physicalAttributes.weight;
        const weightRange = value as { min: number | null, max: number | null };
        if (!weight) return false;
        if (weightRange.min && weight < weightRange.min) return false;
        if (weightRange.max && weight > weightRange.max) return false;
        return true;

      case 'gender':
        return profile.physicalAttributes.gender === value;

      case 'ethnicity':
        return profile.physicalAttributes.ethnicity === value;

      case 'bodyType':
        return profile.physicalAttributes.bodyType === value;

      case 'hairColor':
        return profile.physicalAttributes.hairColor === value;

      case 'eyeColor':
        return profile.physicalAttributes.eyeColor === value;

      case 'bustType':
        return profile.physicalAttributes.bustType === value;

      default:
        return false;
    }
  }
  private applyPhysicalFilter() {
    if (!this.physicalFilter) {
      this.userProfiles = [...this.allProfiles];
      return;
    }

    this.userProfiles = this.allProfiles.filter(profile => {
      if (!profile.physicalAttributes) return false;

      const { attribute, value } = this.physicalFilter!;
      
      switch (attribute) {
        case 'height':
          const height = profile.physicalAttributes.height;
          const heightRange = value as { min: number | null, max: number | null };
          if (!height) return false;
          if (heightRange.min && height < heightRange.min) return false;
          if (heightRange.max && height > heightRange.max) return false;
          return true;

        case 'weight':
          const weight = profile.physicalAttributes.weight;
          const weightRange = value as { min: number | null, max: number | null };
          if (!weight) return false;
          if (weightRange.min && weight < weightRange.min) return false;
          if (weightRange.max && weight > weightRange.max) return false;
          return true;

        case 'gender':
          return profile.physicalAttributes.gender === value;

        case 'ethnicity':
          return profile.physicalAttributes.ethnicity === value;

        case 'bodyType':
          return profile.physicalAttributes.bodyType === value;

        case 'hairColor':
          return profile.physicalAttributes.hairColor === value;

        case 'eyeColor':
          return profile.physicalAttributes.eyeColor === value;

        case 'bustType':
          return profile.physicalAttributes.bustType === value;

        default:
          return false;
      }
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    
    this.currentPage = page;
    this.loadCurrentPage();
  }

  nextPage(): void {
    if (this.pagination && this.pagination.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.pagination && this.pagination.hasPrevPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  loadMore(): void {
    if (this.pagination && this.pagination.hasNextPage && !this.isLoadingMore) {
      this.isLoadingMore = true;
      const nextPage = this.currentPage + 1;
      
      const params: ProfileQueryParams = {
        coordinates: this.userLocation,
        age: this.selectedAge,
        services: this.selectedServices?.join(','),
        page: nextPage,
        limit: this.pageSize
      };

      this.profileService.getAllProfiles(params).subscribe({
        next: (response: PaginatedProfileResponse) => {
          // Append new profiles to existing ones
          this.allProfiles = [...this.allProfiles, ...response.profiles];
          this.userProfiles = [...this.userProfiles, ...response.profiles];
          this.pagination = response.pagination;
          this.currentPage = nextPage;
          this.isLoadingMore = false;
          this.applyAllFilters();
        },
        error: (error) => {
          console.error('Error loading more profiles:', error);
          this.isLoadingMore = false;
        }
      });
    }
  }
  private loadCurrentPage(): void {
    const params: ProfileQueryParams = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Only add parameters that have valid values
    if (this.userLocation) {
      params.coordinates = this.userLocation;
    }
    if (this.selectedAge !== undefined && this.selectedAge !== null) {
      params.age = this.selectedAge;
    }
    if (this.selectedServices && this.selectedServices.length > 0) {
      params.services = this.selectedServices.join(',');
    }

    this.fetchProfiles(params);
  }

  // Helper methods for pagination UI
  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const totalPages = this.pagination.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    
    // Show max 5 pages around current page
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Reset pagination when filters change
  private resetPagination(): void {
    this.currentPage = 1;
    this.pagination = null;
  }
}