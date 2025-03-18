import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.adminService.getToken()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;

    this.adminService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        this.error = error.message || 'Login failed';
        this.isLoading = false;
      }
    });
  }
}
