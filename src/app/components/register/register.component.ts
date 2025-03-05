import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoadingLocation = false;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      birthdate: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoadingLocation = true;
  
    const formValue = this.registerForm.value;
  
    try {
      // Get user's precise location
      const locationResult = await this.locationService.getSmartLocation();
      
      // Ensure the backend receives city & country
      const registrationData = {
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        birthdate: formValue.birthdate,
        currentLocation: {
          latitude: locationResult.location.latitude,
          longitude: locationResult.location.longitude,
          city: locationResult.location.city, // Ensure city is included
          country: locationResult.location.country // Ensure country is included
        }
      };
  
      console.log('Sending Registration Data:', registrationData);
  
      this.authService.register(registrationData).subscribe(
        (response) => {
          this.successMessage = 'Registration successful!';
          this.registerForm.reset();
          // Redirect to update-profile instead of login
          setTimeout(() => {
            this.router.navigate(['/update-profile']);
          }, 1500);
        },
        (error) => {
          this.errorMessage = error.error.message || 'Registration failed';
        }
      );
  
    } catch (error) {
      this.isLoadingLocation = false;
      this.errorMessage = 'Could not determine location, please try again.';
      console.error('Error obtaining location:', error);
    }
  }
  
}