import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { adminRoutes } from '../environments/apiRoutes';
import { Admin, AdminLoginResponse, AdminCreateResponse, UserFileResponse } from '../models/admin.model';
import { UserProfile } from '../models/userProfile.model';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  totalRevenue: number;
  recentSignups: number;
  premiumUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {  private currentAdminSubject = new BehaviorSubject<Admin | null>(null);
  currentAdmin$ = this.currentAdminSubject.asObservable();
  private readonly ADMIN_TOKEN_KEY = 'adminToken';

  constructor(
    private http: HttpClient,
    private router: Router  // Add router injection
  ) {
    this.loadStoredAdmin();
  }

  private loadStoredAdmin() {
    const storedAdmin = localStorage.getItem('currentAdmin');
    if (storedAdmin) {
      this.currentAdminSubject.next(JSON.parse(storedAdmin));
    }
  }

  login(email: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${adminRoutes}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.ADMIN_TOKEN_KEY, response.token);
        localStorage.setItem('currentAdmin', JSON.stringify(response.admin));
        this.currentAdminSubject.next(response.admin);
      }),
      catchError(error => {
        console.error('Admin login failed:', error);
        return throwError(() => new Error(error.error?.message || 'Login failed'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem('currentAdmin');
    this.currentAdminSubject.next(null);
    this.router.navigate(['/admin/login']).then(() => {
      // Force page refresh to clear any cached data
      window.location.reload();
    });
  }

  createAdmin(adminData: Partial<Admin>): Observable<AdminCreateResponse> {
    return this.http.post<AdminCreateResponse>(`${adminRoutes}/create`, adminData).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to create admin')))
    );
  }

  getAllProfiles(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${adminRoutes}/profiles`).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to fetch profiles')))
    );
  }

  getUserFiles(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${adminRoutes}/users/files`).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to fetch user files')))
    );
  }

  updateUserProfile(userId: string, updateData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${adminRoutes}/users/${userId}/edit`, updateData).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to update profile')))
    );
  }

  deleteUserFile(userId: string, fileType: 'images' | 'videos' | 'documents' | 'subscriberVideo', fileId: string): Observable<any> {
    return this.http.delete(`${adminRoutes}/users/${userId}/files/${fileType}/${fileId}`).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to delete file')))
    );
  }

  deleteProfile(profileId: string): Observable<any> {
    return this.http.delete(`${adminRoutes}/profiles/${profileId}`).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to delete profile')))
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  hasPermission(permission: keyof Admin['permissions']): boolean {
    const admin = this.currentAdminSubject.value;
    return admin?.permissions[permission] || false;
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${adminRoutes}/dashboard/stats`);
  }

  getPendingVerificationUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${adminRoutes}/users/pending-verification`).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to fetch users pending verification')))
    );
  }

  approveVerification(userId: string): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${adminRoutes}/users/${userId}/verify/approve`, {}).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to approve verification')))
    );
  }

  rejectVerification(userId: string): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${adminRoutes}/users/${userId}/verify/reject`, {}).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to reject verification')))
    );
  }

  updateModerationFlags(userId: string, moderationFlags: { 
    contentWarnings: number; 
    lastReviewed: Date; 
    reviewerNotes: string;
    flaggedMedia?: {
      mediaId: string;
      mediaType: 'image' | 'video';
      reason?: string;
      flaggedAt?: Date;
    }[];
  }): Observable<UserProfile> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }
    
    return this.http.patch<UserProfile>(
      `${adminRoutes}/profiles/${userId}/moderation`, 
      { moderationFlags }
    ).pipe(
      catchError(error => throwError(() => new Error(error.error?.message || 'Failed to update moderation flags')))
    );
  }
}
