import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { CustomSpinnerComponent } from '../../custom-spinner/custom-spinner.component';
import { AuthenticationService } from '../../services/authentication.service';
import { FileUploadService } from '../../services/file-upload.service';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyConversionService, SupportedCurrency } from '../../services/currency-conversion.service';

interface EditingState {
  fieldName: string | null;
  currentValue: string | number | boolean | string[] | ServiceUpdate | RoleSelections | null;
}

interface RateType {
  [key: string]: number;
}

interface Rates {
  incall: RateType;
  outcall: RateType;
  currency: SupportedCurrency;
}

interface RoleSelections {
  [key: string]: boolean;
}

interface ServiceSelections {
  included: Record<string, boolean>;
  extra: Record<string, number | null>;
}

interface ServiceUpdate {
  included: string[];
  extra: Record<string, number>;
}

interface ServiceAccumulator {
  [key: string]: number;
}

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, CustomSpinnerComponent, RouterModule, FormsModule],
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.css'],
  providers: [ProfileService]
})
export class ProfileDetailComponent implements OnInit {
  profile: UserProfile | null = null;
  isLoading = true;
  error = '';
  isCurrentUser = false;
  userId: string = '';
  images: string[] = [];
  selectedImage: string | null = null;
  rates: Rates = {
    incall: {},
    outcall: {},
    currency: 'EUR'
  };

  editingState: EditingState = {
    fieldName: null,
    currentValue: null
  };

  availableRoles = [
    { value: 'girlfriend', label: 'Girlfriend' },
    { value: 'wife', label: 'Wife' }, 
    { value: 'mistress', label: 'Mistress' },
    { value: 'pornstar', label: 'Pornstar' },
    { value: 'onenight', label: 'One Night' }
  ]; // Remove stray semicolon

  roleSelections: RoleSelections = {};
  selectedCurrency: SupportedCurrency = 'EUR';
  newDuration = '';
  imagePreview: string | null = null;
  selectedImageIndex: number | null = null;

  availableServices = [
    // Basic Services
    'Classic vaginal sex', 'Sex Toys', 'Striptease', 'Uniforms', '69 position', 
    'Cum in face', 'Cum in mouth', 'Cum on body', 'Deepthroat', 'Domination', 
    'Erotic massage', 'Erotic Photos', 'Foot fetish', 'French kissing', 
    'Golden shower give', 'Group sex', 'Oral without condom', 'With 2 men',
    // Pornstar Services
    'Video Recording', 'Photo Shooting', 'Live Cam Show', 'Adult Film Production',
    'Private Show', 'Professional Photos', 'Explicit Content Creation',
    // Mistress Services
    'BDSM', 'Role Play', 'Spanking', 'Bondage', 'Fetish', 'Slave Training',
    'Discipline', 'Humiliation', 'Rope Play', 'Wax Play',
    // Girlfriend Experience
    'Dinner Date', 'Overnight Stay', 'Weekend Trip', 'Social Events',
    'Romantic Evening', 'Cuddling', 'Dating', 'Travel Companion',
    'Dancing', 'Shopping Together'
  ];

  serviceSelections: ServiceSelections = {
    included: {} as Record<string, boolean>,
    extra: {} as Record<string, number | null>
  };

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthenticationService,
    private fileUploadService: FileUploadService,
    private currencyConversionService: CurrencyConversionService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadProfile(id);
    });


    this.authService.currentUser$.subscribe(currentUser => {
      console.log('Current User:', currentUser);
      if (currentUser) {
        this.userId = currentUser._id;
      }
      if (currentUser && this.profile) {
        this.isCurrentUser = currentUser._id === this.profile._id;
      }
    });
  }

  private loadProfile(id: string) {
    this.isLoading = true;
    this.profileService.getProfileById(id).subscribe({
      next: (profile) => {
        console.log('Loaded profile services:', profile.services); // Add logging
        this.profile = {
          ...profile,
          role: profile.role?.length ? profile.role : ['onenight'],
          services: {
            included: profile.services?.included || [], // Ensure included is initialized
            extra: profile.services?.extra || {}  // Ensure extra is initialized
          }
        };
        
        // Log the initialized profile
        console.log('Initialized profile services:', this.profile.services);

        // Initialize rates with default values and proper type checking
        this.rates = {
          incall: { ...(profile.rates?.incall || {}) },
          outcall: { ...(profile.rates?.outcall || {}) },
          currency: (profile.rates?.currency as SupportedCurrency) ?? 'EUR'
        };
        
        this.selectedCurrency = this.rates.currency;
        this.isLoading = false;

        // Update current user status
        this.authService.currentUser$.subscribe(currentUser => {
          if (currentUser) {
            this.isCurrentUser = currentUser._id === profile._id;
          }
        });
      },
      error: (error) => {
        this.error = 'Failed to load profile';
        this.isLoading = false;
        console.error('Error loading profile:', error);
      }
    });
  }

  // Helper methods for displaying data
  getAge(birthdate: Date): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  formatLocation(coordinates: [number, number]): string {
    return `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`;
  }

  formatBirthday(birthdate: string | Date): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  onFileSelected(event: any, index?: number) {
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
    this.profileService.updateVideos(this.userId, videos).subscribe(
      (response: any) => {
        console.log('Videos uploaded successfully', response);
      },
      (error: HttpErrorResponse) => {
        console.error('Error uploading videos', error);
      }
    );
  }

  updateProfilePicture(profilePicture: string) {
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
    this.profileService.updateImages(this.userId, images).subscribe(
      (response: any) => {
        console.log('Images uploaded successfully', response);
        this.images = response.images; // Update local images array if needed
      },
      (error: HttpErrorResponse) => {
        console.error('Error uploading images', error);
      }
    );
  }

  addUserLike() {
    if (this.profile?._id) {
      this.profileService.addUserLike(this.profile._id).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile.userlikes = response.userlikes;
          }
        },
        error: (error) => {
          console.error('Error adding user like:', error);
        }
      });
    }
  }

  addViewerLike() {
    if (this.profile?._id) {
      this.profileService.addViewerLike(this.profile._id).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile.viewerlikes = response.viewerlikes;
          }
        },
        error: (error) => {
          console.error('Error adding viewer like:', error);
        }
      });
    }
  }

  openImageModal(image: string) {
    this.selectedImage = image;
  }

  closeImageModal() {
    this.selectedImage = null;
  }

  startEditing(fieldName: string): void {
    if (!this.isCurrentUser) return;
    
    let currentValue: any;
    
    // Handle nested object paths
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      if (parts[0] === 'rates') {
        const [, type, duration] = parts;
        const ratesObj = (this.rates[type as keyof Rates] as RateType);
        currentValue = ratesObj?.[duration] || '';
      } else {
        let obj = this.profile;
        for (const part of parts) {
          obj = obj?.[part];
        }
        currentValue = obj;
      }
    } else {
      currentValue = this.profile?.[fieldName];
    }

    this.editingState = {
      fieldName,
      currentValue: currentValue?.toString() || ''
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
    if (!this.profile) return;

    let valueToSend: any = this.editingState.currentValue;

    // Add validation for select fields
    if (fieldName === 'physicalAttributes.gender') {
      if (!valueToSend || valueToSend === '') {
        this.error = 'Please select a gender';
        return;
      }
      if (!['female', 'male', 'other'].includes(valueToSend)) {
        this.error = 'Invalid gender value';
        return;
      }
    }
  
    if (fieldName === 'physicalAttributes.pubicHair') {
      if (!valueToSend || valueToSend === '') {
        this.error = 'Please select a style';
        return;
      }
      if (!['Shaved', 'Trimmed', 'Natural'].includes(valueToSend)) {
        this.error = 'Invalid style value';
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
        return;
      }
      console.log('Sending role array:', valueToSend); // Debug log
    }

    // Special handling for ethnicity
    if (fieldName === 'physicalAttributes.ethnicity') {
      if (!valueToSend) {
        this.error = 'Please select an ethnicity';
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
        return;
      }
    }

    // Type conversions before sending to server
    if (fieldName.includes('physicalAttributes.')) {
      if (fieldName.includes('height') || fieldName.includes('weight')) {
        valueToSend = parseFloat(this.editingState.currentValue as string);
        if (isNaN(valueToSend)) {
          this.error = 'Please enter a valid number';
          return;
        }
      } else if (fieldName.includes('tattoos') || fieldName.includes('piercings')) {
        valueToSend = this.editingState.currentValue === 'true';
      }
    }

    this.profileService.updateField(fieldName, valueToSend).subscribe({
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
    const allDurations = new Set<string>();
    Object.keys(this.rates.incall || {}).forEach(d => allDurations.add(d));
    Object.keys(this.rates.outcall || {}).forEach(d => allDurations.add(d));
    return Array.from(allDurations).sort((a, b) => {
      // Custom sorting logic for durations
      const getHours = (duration: string) => {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[0]) : 0;
      };
      return getHours(a) - getHours(b);
    });
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
    if (confirm(`Are you sure you want to delete the rate for ${duration}?`)) {
      delete this.rates.incall[duration];
      delete this.rates.outcall[duration];
      // Update to use single parameter
      this.saveField('rates');
    }
  }

  updateCurrency() {
    if (!this.rates) return;
    
    const previousCurrency = this.rates.currency;
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
      this.profileService.updateField('rates', convertedRates).toPromise(),
      this.profileService.updateField('services', convertedServices).toPromise()
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
    }).catch(error => {
      // Revert changes on error
      this.selectedCurrency = previousCurrency;
      this.rates.currency = previousCurrency;
      console.error('Error updating currency and prices:', error);
      this.error = 'Failed to update currency and prices. Please try again.';
    });
  }

  startEditingServices(): void {
    if (!this.isCurrentUser) return;
    
    // Initialize serviceSelections with existing selections
    this.serviceSelections = {
      included: this.availableServices.reduce((acc, service) => {
        // Keep existing selections from both current state and profile
        acc[service] = this.serviceSelections.included[service] || 
                      this.profile?.services?.included?.includes(service) || 
                      false;
        return acc;
      }, {} as Record<string, boolean>),
      extra: this.availableServices.reduce((acc, service) => {
        // Keep existing extra prices
        acc[service] = this.serviceSelections.extra[service] || 
                      this.profile?.services?.extra?.[service] || 
                      null;
        return acc;
      }, {} as Record<string, number | null>)
    };

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
      const included = Object.keys(this.serviceSelections.included)
        .filter(key => this.serviceSelections.included[key]);
      
      const extra = Object.entries(this.serviceSelections.extra)
        .reduce<{ [key: string]: number }>((acc, [key, value]) => {
          if (value && value > 0) {
            acc[key] = value;
          }
          return acc;
        }, {});

      // Create properly typed service update
      const servicesUpdate: ServiceUpdate = {
        included,
        extra
      };

      this.editingState.currentValue = servicesUpdate;
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
    return this.profile?.services?.included || [];
  }

  getExtraServices(): { service: string; price: number }[] {
    if (!this.profile?.services?.extra) return [];
    return Object.entries(this.profile.services.extra)
      .map(([service, price]) => ({ service, price }));
  }
}
