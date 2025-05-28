import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { AuthenticationService } from '../../services/authentication.service';
import { FileUploadService } from '../../services/file-upload.service';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyConversionService, SupportedCurrency } from '../../services/currency-conversion.service';
import { generateWhatsAppLink } from '../../utils/whatsapp.util';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BehaviorSubject, of, finalize, take, catchError, takeUntil, Subject } from 'rxjs';
import { ProfileSkeletonComponent } from './components/profile-skeleton/profile-skeleton.component';
import { ProfileGalleryComponent } from './components/profile-gallery/profile-gallery.component';
import { Rates, EditingState, RoleSelections, ServiceSelections, ServiceUpdate, ServiceAccumulator, RateType, EditableFields } from '../../models/profile.types';
import { calculateAge, formatLocation } from '../../utils/profile/profile-calculations.util';
import { getRateDurations, validateRateValue } from '../../utils/profile/rate-management.util';
import { initializeServiceSelections, createServiceUpdate } from '../../utils/profile/service-management.util';
import { 
  getLikeButtonTitle, 
  getCoordinates, 
  getWhatsAppLink as getWhatsAppLinkUtil,
  getMediaType,
  availableRoles as availableRoles,
  availableServices as availableServices,
  getIncludedServices as getIncludedServicesUtil,
  getExtraServices as getExtraServicesUtil
} from '../../utils/profile/profile-detail.util';
import { NgOptimizedImage } from '@angular/common';

interface ApiError {
  message: string;
  statusCode?: number;
}

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    FormsModule,
    ScrollingModule,
    // CustomSpinnerComponent,
    ProfileSkeletonComponent,
    // ProfileHeaderComponent,
    ProfileGalleryComponent
  ],  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss', './profile-detail.component.css'],
})
export class ProfileDetailComponent implements OnInit, OnDestroy {
  // Add debug flag
  private debug = true;

  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();
  profile$ = new BehaviorSubject<UserProfile | null>(null);
  isCurrentUser$ = new BehaviorSubject<boolean>(false);

  // Add new properties
  private destroy$ = new Subject<void>();
  private isUpdating = false;

  // Add helper method
  getAsyncBoolean(observable$: BehaviorSubject<boolean>): boolean {
    return observable$.getValue();
  }

  // Add handler method 
  onUpdateProfile(profile: UserProfile): void {
    this.profile$.next(profile);
  }

  profile: UserProfile | null = null;
  isLoading = true;
  error = '';
  isCurrentUser = false;
  userId: string = '';
  images: string[] = [];
  // Change selectedImage to selectedMedia to handle both types
  selectedMedia: string | null = null;
  rates: Rates = {
    incall: {},
    outcall: {},
    currency: 'EUR' as SupportedCurrency
  };

  editingState: EditingState = {
    fieldName: null,
    currentValue: null
  };

  availableRoles = availableRoles;

  roleSelections: RoleSelections = {};
  selectedCurrency: SupportedCurrency = 'EUR';
  newDuration = '';
  imagePreview: string | null = null;
  selectedImageIndex: number | null = null;

  availableServices = availableServices;

  serviceSelections: ServiceSelections = {
    included: {} as Record<string, boolean>,
    extra: {} as Record<string, number | null>
  };

  usePhoneForWhatsapp = false;
  isAuthenticated = false;
  
  // Track user interaction for visual hints
  hasInteracted = false;

  transformedImages: string[] = [];
  transformedVideos: string[] = [];

  currentUser: any; // assumed to be retrieved from authService

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthenticationService,
    public fileUploadService: FileUploadService,
    private currencyConversionService: CurrencyConversionService
  ) {
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    // Move subscriptions from ngOnInit
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(currentUser => {
      if (currentUser) {
        this.userId = currentUser._id;
      }
      if (currentUser && this.profile) {
        this.isCurrentUser = currentUser._id === this.profile._id;
      }
    });

    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.initializeSubscriptions();
    
    // Add debug logging
    if (this.debug) console.log('ProfileDetail: Initializing');
    
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (this.debug) console.log('ProfileDetail: Route params', params);
      const id = params['id'];
      if (id) {
        this.loadProfile(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile(id: string) {
    if (this.debug) console.log('ProfileDetail: Loading profile', id);
    this.isLoading = true;
    this.error = '';

    this.profileService.getProfileById(id).pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        if (this.debug) console.log('ProfileDetail: Load complete');
      })
    ).subscribe({
      next: (profile) => {
        if (this.debug) console.log('ProfileDetail: Profile loaded', profile);
        this.profile = {
          ...profile,
          role: profile.role?.length ? profile.role : ['onenight'],
          services: {
            included: profile.services?.included || [], // Ensure included is initialized
            extra: profile.services?.extra || {}  // Ensure extra is initialized
          }
        };
        
        // Initialize rates with default values and proper type checking
        this.rates = {
          incall: { ...(profile.rates?.incall || {}) },
          outcall: { ...(profile.rates?.outcall || {}) },
          currency: (profile.rates?.currency as SupportedCurrency) ?? 'EUR'
        };
        
        this.selectedCurrency = this.rates.currency;
        this.isLoading = false;

        // Transform media URLs
        this.transformedImages = (profile.images || []).map(imageId => 
          this.fileUploadService.getMediaUrl(imageId)
        );
        
        this.transformedVideos = (profile.videos || []).map(videoId => 
          this.fileUploadService.getMediaUrl(videoId)
        );

        // Update current user status
        this.authService.currentUser$.subscribe(currentUser => {
          if (currentUser) {
            this.isCurrentUser = currentUser._id === profile._id;
          }
        });
      },
      error: (error) => {
        console.error('ProfileDetail: Error loading profile', error);
        this.error = 'Failed to load profile';
      }
    });
  }

  // Helper methods for displaying data
  getAge(birthdate: Date): number {
    return calculateAge(birthdate);
  }

  formatLocation(coordinates: [number, number]): string {
    return formatLocation(coordinates);
  }

  formatBirthday(birthdate: string | Date): number {
    return calculateAge(birthdate);
  }

  canUpload(): boolean {
    return this.profile?.status !== 'pending';
  }

  onFileSelected(event: any, index?: number) {
    if (!this.canUpload()) {
      this.error = 'Your account is pending verification. You cannot upload content at this time.';
      return;
    }

    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.selectedImageIndex = index ?? null;
      
      // Optional: Auto-upload after preview
      if (confirm('Do you want to upload this image?')) {
        this.uploadImages([e.target.result]);
      }
    };
    reader.readAsDataURL(file);
  }


  updateVideos(videos: string[]) {
    if (!this.canUpload()) {
      this.error = 'Your account is pending verification. You cannot upload content at this time.';
      return;
    }
    this.profileService.updateVideos(this.userId, videos).subscribe(
      (response: any) => {
        console.log('Videos uploaded successfully', response);
      },
      (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Failed to upload videos';
        console.error('Error uploading videos:', error);
      }
    );
  }

  updateProfilePicture(profilePicture: string) {
    if (!this.canUpload()) {
      this.error = 'Your account is pending verification. You cannot upload content at this time.';
      return;
    }
    this.profileService.updateProfilePicture(this.userId, profilePicture).subscribe(
      (response: any) => {
        console.log('User Id:', this.userId);

        console.log('Profile picture updated successfully', response);
        if (this.profile) {
          this.profile.profilePicture = response.profilePicture; // Update local profile picture if needed
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error updating profile picture:', error);
      }
    );
  }

  updateProfilePictureFromFile(event: any) {
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.updateProfilePicture(e.target.result); // Assuming you want to store base64 string
    };
    reader.readAsDataURL(file);
  }

  updateVideosFromFile(event: any) {
    const files: FileList = event.target.files;
    const videoArray: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        videoArray.push(e.target.result); // Assuming you want to store base64 strings
        if (i === files.length - 1) {
          this.updateVideos(videoArray);
        }
      };
      reader.readAsDataURL(files[i]);
    }
  }

  uploadImages(images: string[]) {
    if (!this.canUpload()) {
      this.error = 'Your account is pending verification. You cannot upload content at this time.';
      return;
    }

    this.profileService.updateImages(this.userId, images).subscribe({
      next: (response: any) => {
        console.log('Images uploaded successfully', response);
        this.images = response.images;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Failed to upload images';
        console.error('Error uploading images:', error);
      }
    });
  }

  addUserLike() {
    if (!this.isAuthenticated || !this.profile) {
      return;
    }
    // Prevent liking own profile
    if (this.currentUser && this.currentUser._id === this.profile._id) {
      this.error = 'You cannot like your own profile';
      console.log('Attempted to like own profile');
      setTimeout(() => { this.error = ''; }, 3000);
      return;
    }
    this.profileService.addUserLike(this.profile._id).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile.userlikes = response.userlikes;
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || '';
        if (errorMsg === 'You have already liked this profile') {
          this.error = 'You have already liked this profile';
          setTimeout(() => { this.error = ''; }, 3000);
        } else if (errorMsg === 'You cannot like your own profile') {
          this.error = 'You cannot like your own profile';
          setTimeout(() => { this.error = ''; }, 3000);
        } else {
          console.error('Error liking profile:', err);
        }
      }
    });
  }

  addViewerLike() {
    if (this.isAuthenticated || !this.profile?._id) {
      return;
    }
  
    this.profileService.addViewerLike(this.profile._id).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile.viewerlikes = response.viewerlikes;
        }
      },
      error: () => {} // Silent error handling
    });
  }

  // Update methods
  openMediaModal(mediaId: string) {
    this.selectedMedia = mediaId;
  }

  closeMediaModal() {
    this.selectedMedia = null;
  }

  getMediaType(url: string): 'image' | 'video' {
    return getMediaType(url);
  }

  // Update helper method to use EditableFields
  private getNestedValue(obj: any, path: EditableFields): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
  startEditing(fieldName: EditableFields): void {
    if (!this.isCurrentUser || !this.profile) return;
    
    // Mark as interacted to disable initial hint animation
    this.hasInteracted = true;
    
    let currentValue: EditingState['currentValue'] = null;
    
    if (fieldName === 'contact.whatsapp') {
      currentValue = this.profile.contact?.whatsapp || '';
      this.usePhoneForWhatsapp = false;
    } else if (fieldName.includes('.')) {
      if (fieldName.startsWith('rates.')) {
        const [, type, duration] = fieldName.split('.');
        const ratesObj = (this.rates[type as keyof Rates] as RateType);
        currentValue = ratesObj?.[duration]?.toString() || '';
      } else {
        const [parent, child] = fieldName.split('.') as [keyof UserProfile, string];
        const parentObj = this.profile[parent] as any;
        currentValue = parentObj?.[child]?.toString() || '';
      }
    } else {
      const key = fieldName as keyof UserProfile;
      const value = this.profile[key];
      currentValue = value?.toString() || '';
    }

    this.editingState = {
      fieldName,
      currentValue
    };

    // Handle role selections
    if (fieldName === 'role') {
      this.roleSelections = {};
      const roles = Array.isArray(currentValue) ? currentValue : [currentValue];
      roles.forEach(role => {
        if (typeof role === 'string') {
          this.roleSelections[role] = true;
        }
      });
    }
  }

  updateRoleSelections() {
    if (this.editingState.fieldName === 'role') {
      this.editingState.currentValue = Object.keys(this.roleSelections)
        .filter(key => this.roleSelections[key]) as string[];
    }
  }

  cancelEditing(): void {
    this.editingState = {
      fieldName: null,
      currentValue: null
    };
    this.roleSelections = {};
    this.error = '';
  }

  handleEthnicityChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.editingState.currentValue = select.value;
    console.log('Selected ethnicity:', this.editingState.currentValue); // Add logging
  }

  saveField(fieldName: string) {
    if (!this.profile || this.isUpdating) return;

    this.isUpdating = true;
    this.error = '';

    let valueToSend: any = this.editingState.currentValue;

    // Add validation for select fields
    if (fieldName === 'physicalAttributes.gender') {
      if (!valueToSend || valueToSend === '') {
        this.error = 'Please select a gender';
        this.isUpdating = false;
        return;
      }      if (!['female', 'male', 'trans'].includes(valueToSend)) {
        this.error = 'Invalid gender value';
        this.isUpdating = false;
        return;
      }
    }
  
    if (fieldName === 'physicalAttributes.pubicHair') {
      if (!valueToSend || valueToSend === '') {
        this.error = 'Please select a style';
        this.isUpdating = false;
        return;
      }
      if (!['Shaved', 'Trimmed', 'Natural'].includes(valueToSend)) {
        this.error = 'Invalid style value';
        this.isUpdating = false;
        return;
      }
    }

    // Special handling for rates
    if (fieldName === 'rates') {
      valueToSend = {
        incall: { ...this.rates.incall },
        outcall: { ...this.rates.outcall },
        currency: this.rates.currency
      };
      console.log('Sending rates update:', valueToSend); // Debug log
    } else if (fieldName.startsWith('rates.')) {
      const rateValue = parseFloat(this.editingState.currentValue as string);
      if (isNaN(rateValue) || rateValue < 0) {
        this.error = 'Please enter a valid rate';
        this.isUpdating = false;
        return;
      }
      valueToSend = rateValue;
      console.log('Sending rate value:', valueToSend); // Debug log
    }

    // Special handling for role field
    if (fieldName === 'role') {
      if (!Array.isArray(this.editingState.currentValue)) {
        // Convert role selections to array
        valueToSend = Object.keys(this.roleSelections).filter(key => this.roleSelections[key]);
      }
      if ((valueToSend as string[]).length === 0) {
        this.error = 'Please select at least one role';
        this.isUpdating = false;
        return;
      }
      console.log('Sending role array:', valueToSend); // Debug log
    }

    // Special handling for ethnicity
    if (fieldName === 'physicalAttributes.ethnicity') {
      if (!valueToSend) {
        this.error = 'Please select an ethnicity';
        this.isUpdating = false;
        return;
      }
      console.log('Sending ethnicity value:', valueToSend); // Add logging
    }

    // Special handling for services
    if (fieldName === 'services') {
      console.log('Current service selections:', this.serviceSelections); // Add logging

      const serviceUpdate = {
        included: Object.keys(this.serviceSelections.included)
          .filter(key => this.serviceSelections.included[key]),
        extra: Object.entries(this.serviceSelections.extra)
          .reduce<ServiceAccumulator>((acc, [key, value]) => {
            if (value && value > 0) {
              acc[key] = value;
            }
            return acc;
          }, {} as ServiceAccumulator)
      };

      console.log('Service update to send:', serviceUpdate); // Add logging
      valueToSend = serviceUpdate;

      if (serviceUpdate.included.length === 0) {
        this.error = 'Please select at least one service';
        this.isUpdating = false;
        return;
      }
    }

    // Type conversions before sending to server
    if (fieldName.includes('physicalAttributes.')) {
      if (fieldName.includes('height') || fieldName.includes('weight')) {
        valueToSend = parseFloat(this.editingState.currentValue as string);
        if (isNaN(valueToSend)) {
          this.error = 'Please enter a valid number';
          this.isUpdating = false;
          return;
        }
      } else if (fieldName.includes('tattoos') || fieldName.includes('piercings')) {
        valueToSend = this.editingState.currentValue === 'true';
      }
    }

    // Special handling for WhatsApp
    if (fieldName === 'contact.whatsapp' && this.usePhoneForWhatsapp) {
      valueToSend = this.profile.contact?.phone || '';
    }

    // Email validation
    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(valueToSend)) {
        this.error = 'Please enter a valid email address';
        this.isUpdating = false;
        return;
      }
    }

    // WhatsApp number validation
    if (fieldName === 'contact.whatsapp') {
      const phoneRegex = /^\+?[\d\s-]+$/;
      if (!phoneRegex.test(valueToSend)) {
        this.error = 'Please enter a valid phone number';
        this.isUpdating = false;
        return;
      }
    }

    this.profileService.updateField(fieldName, valueToSend).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        const apiError: ApiError = error.error || { message: `Failed to update ${fieldName}` };
        this.error = apiError.message;
        throw error;
      }),
      finalize(() => {
        this.isUpdating = false;
      })
    ).subscribe({
      next: (updatedProfile) => {
        console.log('Profile after update:', updatedProfile); // Add logging
        
        if (fieldName === 'services') {
          // Ensure services are properly updated in the local profile
          this.profile = {
            ...this.profile,
            services: {
              included: updatedProfile.services?.included || [],
              extra: updatedProfile.services?.extra || {}
            }
          } as UserProfile;
          
          console.log('Updated local profile services:', this.profile.services);
        } else {
          this.profile = { ...updatedProfile };
        }

        // Ensure role is always an array
        if (!Array.isArray(this.profile.role)) {
          this.profile.role = [this.profile.role];
        }
        if (updatedProfile.rates) {
          this.rates = {
            incall: { ...updatedProfile.rates.incall },
            outcall: { ...updatedProfile.rates.outcall },
            currency: (updatedProfile.rates.currency as SupportedCurrency) || this.rates.currency || 'EUR' // Provide fallback values
          };
          this.selectedCurrency = this.rates.currency; // Keep selectedCurrency in sync
        }

        this.editingState = {
          fieldName: null,
          currentValue: null
        };
      },
      error: (error) => {
        console.error(`Error updating ${fieldName}:`, error);
        this.cancelEditing();
        this.error = `Failed to update ${fieldName}. Please try again.`;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  // Add these new methods
  getRateDurations(): string[] {
    return getRateDurations(this.rates);
  }

  addNewRate(): void {
    if (!this.newDuration) return;
    const duration = this.newDuration.trim();
    if (!this.rates.incall) this.rates.incall = {};
    if (!this.rates.outcall) this.rates.outcall = {};
    this.rates.incall[duration] = 0;
    this.rates.outcall[duration] = 0;
    this.saveField('rates');
    this.newDuration = '';
  }

  deleteRate(duration: string) {
    if (!this.profile?._id) return;

    if (confirm(`Are you sure you want to delete the rate for ${duration}?`)) {
      this.profileService.deleteRate(this.profile._id, duration).subscribe({
        next: (updatedProfile) => {
          if (this.profile) {
            // Update local rates object
            this.rates = {
              incall: { ...(updatedProfile.rates?.incall || {}) },
              outcall: { ...(updatedProfile.rates?.outcall || {}) },
              currency: (updatedProfile.rates?.currency as SupportedCurrency) ?? 'EUR'
            };
            this.profile.rates = updatedProfile.rates;
          }
        },
        error: (error) => {
          this.error = 'Failed to delete rate';
          console.error('Error deleting rate:', error);
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  updateCurrency() {
    if (!this.rates || this.isUpdating) return;

    this.isUpdating = true;
    const previousCurrency = this.rates.currency as SupportedCurrency;
    const newCurrency = this.selectedCurrency;

    // First convert rates
    const convertedRates = {
      incall: Object.fromEntries(
        Object.entries(this.rates.incall).map(([duration, rate]) => [
          duration,
          this.currencyConversionService.convert(rate, previousCurrency, newCurrency)
        ])
      ),
      outcall: Object.fromEntries(
        Object.entries(this.rates.outcall).map(([duration, rate]) => [
          duration,
          this.currencyConversionService.convert(rate, previousCurrency, newCurrency)
        ])
      ),
      currency: newCurrency
    };

    // Then convert service prices
    const convertedServices = {
      included: [...(this.profile?.services?.included || [])],
      extra: Object.fromEntries(
        Object.entries(this.profile?.services?.extra || {}).map(([service, price]) => [
          service,
          this.currencyConversionService.convert(price, previousCurrency, newCurrency)
        ])
      )
    };

    // Update both rates and services in one batch
    Promise.all([
      this.profileService.updateField('rates', convertedRates).pipe(take(1)).toPromise(),
      this.profileService.updateField('services', convertedServices).pipe(take(1)).toPromise()
    ]).then(([ratesUpdate, servicesUpdate]) => {
      if (ratesUpdate && servicesUpdate) {
        this.profile = { 
          ...this.profile, 
          rates: ratesUpdate.rates,
          services: servicesUpdate.services
        } as UserProfile;
        
        this.rates = {
          incall: { ...ratesUpdate.rates.incall },
          outcall: { ...ratesUpdate.rates.outcall },
          currency: newCurrency as SupportedCurrency
        };
        
        this.selectedCurrency = newCurrency;
        console.log('Currency and related prices updated successfully');
      }
    }).catch((error: HttpErrorResponse) => {
      // Revert changes on error
      this.selectedCurrency = previousCurrency;
      this.rates.currency = previousCurrency;
      const apiError: ApiError = error.error || { message: 'Failed to update currency and prices' };
      this.error = apiError.message;
      console.error('Error updating currency and prices:', error);
    }).finally(() => {
      this.isUpdating = false;
    });
  }

  startEditingServices(): void {
    if (!this.isCurrentUser) return;
    
    // Change null to undefined when passing to the utility function
    this.serviceSelections = initializeServiceSelections(
      this.availableServices,
      this.serviceSelections,
      this.profile || undefined  // Convert null to undefined here
    );

    this.editingState = {
      fieldName: 'services',
      currentValue: {
        included: Object.keys(this.serviceSelections.included)
          .filter(key => this.serviceSelections.included[key]),
        extra: { ...this.serviceSelections.extra }
      } as ServiceUpdate
    };
  }

  updateServices() {
    if (this.editingState.fieldName === 'services') {
      const serviceUpdate: ServiceUpdate = {
        included: Object.keys(this.serviceSelections.included)
          .filter(key => this.serviceSelections.included[key]),
        extra: Object.entries(this.serviceSelections.extra)
          .reduce<{ [key: string]: number }>((acc, [key, value]) => {
            if (value && value > 0) {
              acc[key] = value;
            }
            return acc;
          }, {})
      };

      this.editingState = {
        fieldName: 'services',
        currentValue: serviceUpdate
      };
      this.saveField('services');
    }
  }

  handleServiceSelection(service: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      // If service is being included, remove it from extra prices
      this.serviceSelections.included[service] = true;
      this.serviceSelections.extra[service] = null;
    } else {
      this.serviceSelections.included[service] = false;
    }
  
    this.editingState.currentValue = {
      included: Object.keys(this.serviceSelections.included)
        .filter(key => this.serviceSelections.included[key]),
      extra: this.serviceSelections.extra
    } as ServiceUpdate;
  }

  handleExtraPriceChange(service: string, price: number | null): void {
    if (price && price > 0) {
      // If setting an extra price, remove from included services
      this.serviceSelections.included[service] = false;
      this.serviceSelections.extra[service] = price;
    } else {
      this.serviceSelections.extra[service] = null;
    }
  
    this.editingState.currentValue = {
      included: Object.keys(this.serviceSelections.included)
        .filter(key => this.serviceSelections.included[key]),
      extra: this.serviceSelections.extra
    } as ServiceUpdate;
  }

  // Add new helper methods
  getIncludedServices(): string[] {
    return this.profile ? getIncludedServicesUtil(this.profile) : [];
  }

  getExtraServices(): { service: string; price: number }[] {
    return this.profile ? getExtraServicesUtil(this.profile) : [];
  }

  getWhatsAppLink(): string {
    if (!this.profile || !this.profile.contact || !this.profile.contact.whatsapp) {
      return '#';
    }
    const defaultMessage = `Hi ${this.profile.fullName || ''}, I saw your profile on https://spanexx.com`;
    return getWhatsAppLinkUtil(this.profile.contact.whatsapp, defaultMessage);
  }

  isEditing(fieldName: string): boolean {
    return this.editingState.fieldName === fieldName;
  }

  getLikeButtonTitle(): string {
    return getLikeButtonTitle(this.isAuthenticated, this.isCurrentUser);
  }

  deleteImage(imageUrl: string) {
    if (!this.profile?._id) return;

    if (confirm('Are you sure you want to delete this image?')) {
      const imageId = this.getOriginalMediaId(imageUrl);
      
      // First delete the media file
      this.fileUploadService.deleteMedia(imageId).subscribe({
        next: () => {
          // Then update the profile to remove the reference
          this.profileService.deleteImage(this.profile!._id, imageId).subscribe({
            next: (updatedProfile) => {
              if (this.profile) {
                this.profile.images = updatedProfile.images || [];
                // Update the transformed images array
                this.transformedImages = this.profile.images.map(id => 
                  this.fileUploadService.getMediaUrl(id)
                );
              }
            },
            error: (error) => {
              this.error = 'Failed to update profile after image deletion';
              console.error('Error updating profile:', error);
            }
          });
        },
        error: (error) => {
          this.error = 'Failed to delete image file';
          console.error('Error deleting image file:', error);
        }
      });
    }
  }

  deleteVideo(videoUrl: string) {
    if (!this.profile?._id) return;

    if (confirm('Are you sure you want to delete this video?')) {
      const videoId = this.getOriginalMediaId(videoUrl);
      
      // First delete the media file
      this.fileUploadService.deleteMedia(videoId).subscribe({
        next: () => {
          // Then update the profile to remove the reference
          this.profileService.deleteVideo(this.profile!._id, videoId).subscribe({
            next: (updatedProfile) => {
              if (this.profile) {
                this.profile.videos = updatedProfile.videos || [];
                // Update the transformed videos array
                this.transformedVideos = this.profile.videos.map(id => 
                  this.fileUploadService.getMediaUrl(id)
                );
              }
            },
            error: (error) => {
              this.error = 'Failed to update profile after video deletion';
              console.error('Error updating profile:', error);
            }
          });
        },
        error: (error) => {
          this.error = 'Failed to delete video file';
          console.error('Error deleting video file:', error);
        }
      });
    }
  }

  getRatePath(type: 'incall' | 'outcall', duration: string): EditableFields {
    return `rates.${type}.${duration}` as EditableFields;
  }

  getOriginalMediaId(mediaUrl: string): string {
    // Extract the ID from the end of the URL
    return mediaUrl.split('/').pop() || '';
  }


  getProfilePictureUrl(): string {
    if (this.profile?.profilePicture) {
      return this.fileUploadService.getMediaUrl(this.profile.profilePicture);
    }
    return 'assets/avatar.jpg';
  }

  // Add helper method for error handling
  private handleApiError(error: HttpErrorResponse, defaultMessage: string): string {
    if (error.error?.message) {
      return error.error.message;
    }
    return defaultMessage;
  }
}
