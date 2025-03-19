import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs'
import { UserProfile } from '../models/userProfile.model';
import { authRoutes, meRoute } from '../../environments/apiRoutes';
import { LoginResponse } from '../interfaces/auth.interface';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<UserProfile | null>;
  public currentUser$: Observable<UserProfile | null>; // Rename to currentUser$
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'auth_data';
  private cookieConsentAccepted = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = this.getCurrentUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<UserProfile | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable(); // Rename to currentUser$
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
      // Try cookies first, fall back to localStorage
      if (this.cookieConsentAccepted) {
        document.cookie = `currentUser=${JSON.stringify(user)};path=/;SameSite=Strict`;
      }
      // Always store in localStorage as fallback
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        user,
        timestamp: new Date().getTime()
      }));
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

  public getCurrentUserFromStorage(): UserProfile | null {
    try {
      // Try getting from localStorage first
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const {user, timestamp} = JSON.parse(stored);
        // Check if data is less than 24 hours old
        if (new Date().getTime() - timestamp < 24 * 60 * 60 * 1000) {
          return user;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public setCookieConsent(accepted: boolean): void {
    this.cookieConsentAccepted = accepted;
    localStorage.setItem('cookie_consent', String(accepted));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    const params: { [key: string]: string } = {};
    
    if (lat != null && lon != null) {
      params['coordinates'] = [lon, lat].join(',');
    }
    
    if (filters?.age != null && !isNaN(filters.age)) {
      params['age'] = filters.age.toString();
    }
    
    if (filters?.services?.length) {
      params['services'] = filters.services.join(',');
    }
  
    // Remove any undefined values
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    );
  
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
        return throwError(() => new Error('Failed to fetch user details'));
      })
    );
  }

  async refreshCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/auth/me`));
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  /**
   * Log out the current user.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.STORAGE_KEY);
    if (this.cookieConsentAccepted) {
      document.cookie = 'currentUser=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    this.currentUserSubject.next(null);
    // Force page refresh
    window.location.reload();
  }
}