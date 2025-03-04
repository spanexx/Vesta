import { Component } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Profile } from '../../models/profile.model';
import { LocationService } from '../../services/location.service';
import { MatDialog } from '@angular/material/dialog';
import { LocationPromptComponent } from '../location-prompt/location-prompt.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomSpinnerComponent } from '../../custom-spinner/custom-spinner.component';
import { LocationButtonComponent } from '../../location-button/location-button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    CustomSpinnerComponent, 
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  userProfiles: Profile[] = [];
  isLoading = false;
  locationMessage = '';
  currentLocation?: { latitude: number; longitude: number };
  locationError = '';

  constructor(
    private authService: AuthenticationService,
    private locationService: LocationService,
    private dialog: MatDialog
  ) {}

  async loadProfiles() {
    this.isLoading = true;
    this.locationError = '';
    
    try {
      // Show location permission dialog
      const dialogRef = this.dialog.open(LocationPromptComponent, {
        width: '350px',
        disableClose: true
      });
      
      const useLocation = await dialogRef.afterClosed().toPromise();
      
      if (useLocation) {
        const { location, isFallback } = await this.locationService.getSmartLocation();
        this.currentLocation = location;
        this.locationMessage = isFallback ? 
          'Using default location' : 
          'Using your current location';
      } else {
        this.currentLocation = this.locationService.getDefaultLocation();
        this.locationMessage = 'Using default location';
      }
      
      this.authService.getProfiles(
        this.currentLocation.latitude,
        this.currentLocation.longitude
      ).subscribe({
        next: (profiles) => {
          this.userProfiles = profiles;
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('Failed to load profiles');
          this.isLoading = false;
        }
      });
      
    } catch (error) {
      this.handleError('Error getting location');
      this.loadProfilesWithoutLocation();
    }
  }

  private loadProfilesWithoutLocation() {
    this.authService.getProfiles().subscribe({
      next: (profiles) => {
        this.userProfiles = profiles;
        this.isLoading = false;
      },
      error: (error) => this.handleError('Failed to load profiles')
    });
  }

  private handleError(message: string) {
    this.locationError = message;
    this.isLoading = false;
    console.error(message);
  }
}