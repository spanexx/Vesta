import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { UserProfile } from '../models/userProfile.model';
import { authRoutes, meRoute } from '../../environments/apiRoutes';
import { LoginResponse } from '../interfaces/auth.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load saved user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  private setCurrentUser(user: UserProfile): void {
     // Define minimal user type
  interface MinimalUser {
    _id: string;
    email: string;
    username: string;
    profilePicture: string;
    isCurrentUser: boolean;
  }

  // Create minimal user object with default profile picture if none exists
  const minimalUser: MinimalUser = {
    _id: user._id,
    email: user.email,
    username: user.username,
    profilePicture: user.profilePicture || '/assets/images/default-profile.png', // Provide default value
    isCurrentUser: true
  };
  
    try {
      localStorage.setItem('currentUser', JSON.stringify(minimalUser));
      this.currentUserSubject.next(user);
    } catch (error: unknown) {
      // Type guard for DOMException
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        localStorage.clear(); // Clear all items
        try {
          localStorage.setItem('currentUser', JSON.stringify(minimalUser));
        } catch (retryError) {
          console.error('Could not store user data even after clearing storage');
        }
      } else {
        console.error('Error storing user data:', error);
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Register a new user.
   * @param user The user data to register.
   * @returns An observable with the registration response.
   */
  register(user: any): Observable<any> {
    return this.http.post(`${authRoutes}/register`, user).pipe(
      catchError((error) => {
        console.error('Registration failed:', error);
        return throwError(() => new Error('Registration failed. Please try again.'));
      })
    );
  }

  /**
   * Log in a user.
   * @param user The user credentials (email and password).
   * @returns An observable with the login response (including the JWT token).
   */
  login(user: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${authRoutes}/login`, user).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          // After successful login, fetch the current user
          this.getCurrentUser().subscribe({
            next: () => this.router.navigate(['/']),
            error: (error) => {
              console.error('Error fetching user:', error);
              this.logout();
            }
          });
        }
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Invalid credentials'));
      })
    );
  }

  /**
   * Fetch profiles with optional location filtering.
   * @param lat The latitude of the viewer's location.
   * @param lon The longitude of the viewer's location.
   * @param filters Optional filters (e.g., age, services).
   * @returns An observable with the list of profiles.
   */
  getProfiles(
    lat?: number,
    lon?: number,
    filters?: { age?: number; services?: string[] }
  ): Observable<UserProfile[]> {
    // Build query parameters
    const params: any = {};
    if (lat && lon) {
      params.lat = lat.toString();
      params.lon = lon.toString();
    }
    if (filters?.age) {
      params.age = filters.age.toString();
    }
    if (filters?.services) {
      params.services = filters.services.join(',');
    }

    return this.http.get<UserProfile[]>(`${authRoutes}/profiles`, { params }).pipe(
      catchError((error) => {
        console.error('Failed to fetch profiles:', error);
        return throwError(() => new Error('Failed to fetch profiles. Please try again later.'));
      })
    );
  }

  /**
   * Get the current user.
   * @returns An observable with the current user details.
   */
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(meRoute).pipe(
      tap(user => {
        this.setCurrentUser(user);
      }),
      catchError(error => {
        console.error('Failed to fetch current user:', error);
        return throwError(() => new Error('Failed to fetch user details'));
      })
    );
  }
  /**
   * Log out the current user.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    // Force page refresh
    window.location.reload();
  }
}