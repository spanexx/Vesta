import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoadingLocation = false;
  showPassword = false;

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
      birthdate: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]  // Add this line
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
        termsAccepted: formValue.termsAccepted,  // Add this line
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
            this.router.navigate(['/settings']);
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

  showError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? (field.invalid && field.touched) || (field.invalid && field.dirty) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['underage']) {
      return 'You must be at least 18 years old';
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}