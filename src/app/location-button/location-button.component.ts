import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../services/authentication.service';
import { LocationService } from '../services/location.service';
import { LocationPromptComponent } from '../components/location-prompt/location-prompt.component';
import { Profile } from '../models/profile.model';

@Component({
  selector: 'app-location-button',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './location-button.component.html',
  styleUrls: ['./location-button.component.css']
})
export class LocationButtonComponent {
  isLoading = false;

  constructor(
    private authService: AuthenticationService,
    private locationService: LocationService,
    private dialog: MatDialog
  ) {}

  async loadProfiles() {
    this.isLoading = true;
    try {
      // Show location permission dialog
      const dialogRef = this.dialog.open(LocationPromptComponent, {
        width: '350px',
        disableClose: true
      });
      
      const useLocation = await dialogRef.afterClosed().toPromise();
      
      if (useLocation) {
        const { location, isFallback } = await this.locationService.getSmartLocation();
        const latitude = location.latitude;
        const longitude = location.longitude;
        this.authService.getProfiles(
          latitude,
          longitude
        ).subscribe({
          next: (profiles: Profile[]) => {
            // TO DO: handle profiles
          },
          error: (error: any) => {
            // TO DO: handle error
          }
        });
      } else {
        const defaultLocation = this.locationService.getDefaultLocation();
        const latitude = defaultLocation.latitude;
        const longitude = defaultLocation.longitude;
        this.authService.getProfiles(
          latitude,
          longitude
        ).subscribe({
          next: (profiles: Profile[]) => {
            // TO DO: handle profiles
          },
          error: (error: any) => {
            // TO DO: handle error
          }
        });
      }
    } catch (error) {
      // TO DO: handle error
    }
  }
}
