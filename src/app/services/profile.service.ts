import { authRoutes } from './../../environments/apiRoutes';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError, map } from 'rxjs';
import { UserProfile } from '../models/userProfile.model';
import { profileRoutes } from '../../environments/apiRoutes';

export interface LocationStats {
  countries: Array<{country: string, count: number}>;
  cities: {[country: string]: Array<{city: string, count: number}>};
}

export interface LocationStats {
  countries: Array<{country: string, count: number}>;
  cities: {[country: string]: Array<{city: string, count: number}>};
}

export interface LocationFilter {
  country?: string;
  city?: string;
}

export interface ProfileQueryParams {
  viewerLocation?: string;
  coordinates?: [number, number] | undefined;  // Updated to match possible undefined state
  age?: number;
  services?: string;
  page?: number;
  limit?: number;
  // role?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedProfileResponse {
  profiles: UserProfile[];
  pagination: PaginationInfo;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private likedProfilesKey = 'anonymousLikedProfiles';
  private anonymousIdKey = 'anonymousUserId';
  private _profileCache = new Map<string, UserProfile>();

  constructor(private authService: AuthenticationService, private http: HttpClient) { }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${profileRoutes}/update`, profileData);
  }

  getProfileById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${profileRoutes}/${id}`);
  }

  filterByService(serviceType: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${profileRoutes}/filter`, {
      params: { serviceType }
    });
  }

  getLocationStats(): Observable<LocationStats> {
    return this.http.get<LocationStats>(`${profileRoutes}/location-stats`)
      .pipe(
        catchError(error => {
          console.error('Location stats failed:', error);
          throw error;
        })
      );
  }

  filterByLocation(filter: LocationFilter): Observable<UserProfile[]> {
    let params = new HttpParams();
    
    if (filter.country) {
      params = params.set('country', filter.country);
    }
    if (filter.city) {
      params = params.set('city', filter.city);
    }

    return this.http.get<UserProfile[]>(`${profileRoutes}/location`, { params })
      .pipe(
        catchError(error => {
          console.error('Location filtering failed:', error);
          throw error;
        })
      );
  }  getAllProfiles(filters?: ProfileQueryParams): Observable<PaginatedProfileResponse> {
    // Filter out undefined values and properly format the parameters
    const cleanParams: any = {};
    
    if (filters) {
      if (filters.coordinates && Array.isArray(filters.coordinates)) {
        cleanParams.coordinates = filters.coordinates.join(',');
      }
      if (filters.age !== undefined && filters.age !== null) {
        cleanParams.age = filters.age.toString();
      }
      if (filters.services && filters.services.trim() !== '') {
        cleanParams.services = filters.services;
      }
      if (filters.page !== undefined) {
        cleanParams.page = filters.page.toString();
      }
      if (filters.limit !== undefined) {
        cleanParams.limit = filters.limit.toString();
      }
    }

    return this.http.get<PaginatedProfileResponse>(`${authRoutes}/profiles`, {
      params: cleanParams
    }).pipe(
      tap((response) => console.log('Fetched paginated profiles:', response.profiles.length)), // Debug log
      catchError(error => {
        console.error('Error fetching profiles:', error); // Error log
        return throwError(() => error);
      })
    );
  }

  // Method to get usernames and emails for autocomplete
  getProfileSuggestions(): Observable<{usernames: string[], emails: string[]}> {
    return this.getAllProfiles({ limit: 1000 }).pipe(
      map(response => {
        const usernames = response.profiles
          .map(profile => profile.username)
          .filter(username => username && username.trim() !== '')
          .sort();
        
        const emails = response.profiles
          .map(profile => profile.email)
          .filter(email => email && email.trim() !== '')
          .sort();
        
        return { usernames, emails };
      }),
      catchError(error => {
        console.error('Error fetching profile suggestions:', error);
        return throwError(() => error);
      })
    );
  }

  
  updateImages(userId: string, images: string[]): Observable<any> {
    console.log('Updating images for user:', userId);
    console.log('Images:', images);
    return this.http.put(`${profileRoutes}/${userId}/images`, { images });
  }

  updateVideos(userId: string, videos: string[]): Observable<any> {
    return this.http.put(`${profileRoutes}/${userId}/videos`, { videos });
  }

  updateProfilePicture(userId: string, profilePicture: string): Observable<any> {
    const url = `${profileRoutes}/${userId}/profilePicture`;
    console.log('Updating profile picture with URL:', url);
    console.log('Payload:', { profilePicture });
    return this.http.put(url, { profilePicture });
  }

  addUserLike(profileId: string): Observable<{ userlikes: number }> {
    if (this.isProfileLikedAnonymously(profileId)) {
      return this.getProfileById(profileId).pipe(
        map(profile => ({ userlikes: profile.userlikes || 0 }))
      );
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );
    
    return this.http.post<{ userlikes: number }>(
      `${profileRoutes}/${profileId}/like/user`, 
      {},
      { headers }
    ).pipe(
      catchError(error => {
        if (
          error.status === 400 &&
          (error?.error?.error === 'ALREADY_LIKED' ||
           error?.error?.message?.includes('already liked'))
        ) {
          // Return an observable with the current userlikes count
          return this.getProfileById(profileId).pipe(
            map(profile => ({ userlikes: profile.userlikes || 0 }))
          );
        }
        // Propagate other errors
        return throwError(() => error);
      })
    );
  }

  private isProfileLikedAnonymously(profileId: string): boolean {
    const likedProfiles = this.getAnonymousLikedProfiles();
    return likedProfiles.includes(profileId);
  }

  private getAnonymousLikedProfiles(): string[] {
    const stored = localStorage.getItem(this.likedProfilesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private addAnonymousProfileLike(profileId: string): void {
    const likedProfiles = this.getAnonymousLikedProfiles();
    if (!likedProfiles.includes(profileId)) {
      likedProfiles.push(profileId);
      localStorage.setItem(this.likedProfilesKey, JSON.stringify(likedProfiles));
    }
  }

  private getOrCreateAnonymousId(): string {
    let id = localStorage.getItem(this.anonymousIdKey);
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem(this.anonymousIdKey, id);
    }
    return id;
  }

  addViewerLike(profileId: string): Observable<{ viewerlikes: number }> {
    // Generate a unique anonymous ID
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Check local storage for previous likes
    const likedProfiles = this.getAnonymousLikedProfiles();
    if (likedProfiles.includes(profileId)) {
      // If already liked, return current likes count
      return this.getProfileById(profileId).pipe(
        map(profile => ({ viewerlikes: profile.viewerlikes || 0 }))
      );
    }
  
    return this.http.post<{ viewerlikes: number }>(
      `${profileRoutes}/${profileId}/like/viewer`,
      { anonymousId }
    ).pipe(
      tap(() => {
        // Add profile to liked profiles in local storage
        this.addAnonymousProfileLike(profileId);
      }),
      catchError(error => {
        if (error.status === 400) {
          return this.getProfileById(profileId).pipe(
            map(profile => ({ viewerlikes: profile.viewerlikes || 0 }))
          );
        }
        return throwError(() => error);
      })
    );
  }

  updateField(fieldName: string, value: any): Observable<UserProfile> {
    
    // Special handling for rates field
    if (fieldName === 'rates') {
      // Ensure we're sending a complete rates object
      const ratesUpdate = {
        incall: value.incall || {},
        outcall: value.outcall || {},
        currency: value.currency || 'EUR'
      };
      console.log('Formatted rates update:', ratesUpdate);
      return this.http.patch<UserProfile>(`${profileRoutes}/field/${fieldName}`, { value: ratesUpdate });
    }

    // Special handling for services field
    if (fieldName === 'services') {
      console.log('Processing services update:', value);
      const servicesUpdate = {
        included: Array.isArray(value.included) ? value.included : [],
        extra: value.extra && typeof value.extra === 'object' ? value.extra : {}
      };
      
      console.log('Formatted services update:', servicesUpdate);
      return this.http.patch<UserProfile>(
        `${profileRoutes}/field/${fieldName}`, 
        { value: servicesUpdate }
      );
    }
    
    return this.http.patch<UserProfile>(`${profileRoutes}/field/${fieldName}`, { value });
  }

  filterByRole(role: string): Observable<UserProfile[]> {
    console.log('Filtering by role:', role);
    return this.http.get<UserProfile[]>(`${profileRoutes}/filter`, {
      params: { role }
    }).pipe(
      tap(profiles => console.log(`Received ${profiles.length} profiles for role ${role}`)),
      catchError(error => {
        console.error('Role filtering failed:', error);
        return throwError(() => error);
      })
    );
  }

  deleteProfile(profileId: string): Observable<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.delete(`${profileRoutes}/${profileId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error deleting profile:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete profile'));
      })
    );
  }

  deleteField(profileId: string, fieldName: string[]): Observable<any> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.delete(`${profileRoutes}/${profileId}/field/${fieldName}`, { headers }).pipe(
      catchError(error => {
        console.error(`Error deleting field ${fieldName}:`, error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete field'));
      })
    );
  }

  deleteImage(profileId: string, imageUrl: string): Observable<UserProfile> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.delete<UserProfile>(
      `${profileRoutes}/${profileId}/images`, 
      { 
        headers,
        body: { imageUrl }  // Send image URL in request body
      }
    ).pipe(
      tap(updatedProfile => {
        // Update cache if using caching
        if (this._profileCache.has(profileId)) {
          this._profileCache.set(profileId, updatedProfile);
        }
      }),
      catchError(error => {
        console.error('Error deleting image:', error);
        return throwError(() => new Error('Failed to delete image'));
      })
    );
  }

  deleteRate(profileId: string, duration: string): Observable<UserProfile> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.delete<UserProfile>(
      `${profileRoutes}/${profileId}/rates/${duration}`,
      { headers }
    ).pipe(
      tap(updatedProfile => {
        if (this._profileCache.has(profileId)) {
          this._profileCache.set(profileId, updatedProfile);
        }
      }),
      catchError(error => {
        console.error('Error deleting rate:', error);
        return throwError(() => new Error('Failed to delete rate'));
      })
    );
  }

  deleteVideo(profileId: string, videoUrl: string): Observable<UserProfile> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.delete<UserProfile>(
      `${profileRoutes}/${profileId}/videos`,
      {
        headers,
        body: { videoUrl }  // Send video URL in request body
      }
    ).pipe(
      tap(updatedProfile => {
        if (this._profileCache.has(profileId)) {
          this._profileCache.set(profileId, updatedProfile);
        }
      }),
      catchError(error => {
        console.error('Error deleting video:', error);
        return throwError(() => new Error('Failed to delete video'));
      })
    );
  }

  updateVerificationDocuments(userId: string, documentData: string, side: 'front' | 'back'): Observable<UserProfile> {
    return this.http.post<UserProfile>(
      `${profileRoutes}/${userId}/verification-documents`,
      { documentData, side }
    );
  }

  updateSubscription(userId: string, subscriptionData: any): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${profileRoutes}/${userId}/subscription`, subscriptionData);
  }
}


