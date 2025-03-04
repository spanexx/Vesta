import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Profile } from '../models/profile.model';
import { authRoutes } from '../../environments/apiRoutes';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private token: string | null = null; // Store the JWT token

  constructor(private http: HttpClient) {}

  /**
   * Get the stored JWT token.
   * @returns The JWT token or null if not set.
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set the JWT token.
   * @param token The JWT token to store.
   */
  setToken(token: string): void {
    this.token = token;
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
  login(user: { email: string; password: string }): Observable<any> {
    return this.http.post(`${authRoutes}/login`, user).pipe(
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Invalid credentials. Please try again.'));
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
  ): Observable<Profile[]> {
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

    return this.http.get<Profile[]>(`${authRoutes}/profiles`, { params }).pipe(
      catchError((error) => {
        console.error('Failed to fetch profiles:', error);
        return throwError(() => new Error('Failed to fetch profiles. Please try again later.'));
      })
    );
  }
}