import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private authenticationService: AuthenticationService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    // navigator.geolocation.getCurrentPosition((position) => {
    //   const latitude = position.coords.latitude;
    //   const longitude = position.coords.longitude;
    //   console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    // });
  }

  login(): void {
    if (this.loginForm.invalid) {
      // Handle form validation errors
      console.error('Form is invalid');
      return;
    }

    // Extract non-nullable values from the form
    const { email, password } = this.loginForm.value;

    // Ensure email and password are not null or undefined
    if (email && password) {
      this.authenticationService.login({ email, password }).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
        },
        error: (error) => {
          console.error('Login failed:', error);
        },
      });
    } else {
      console.error('Email or password is missing');
    }
  }
}