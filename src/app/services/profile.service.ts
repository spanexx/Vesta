import { authRoutes } from './../../environments/apiRoutes';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError, map } from 'rxjs';
import { UserProfile } from '../models/userProfile.model';
import { profileRoutes } from '../../environments/apiRoutes';

export interface LocationFilter {
  country?: string;
  city?: string;
}

export interface ProfileQueryParams {
  viewerLocation?: string;
  coordinates?: [number, number] | undefined;  // Updated to match possible undefined state
  age?: number;
  services?: string;
  // role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private likedProfilesKey = 'anonymousLikedProfiles';
  private anonymousIdKey = 'anonymousUserId';

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
  }

  getAllProfiles(filters?: ProfileQueryParams): Observable<UserProfile[]> {
    console.log('getAllProfiles called with filters:', filters); // Debug log
    return this.http.get<UserProfile[]>(`${authRoutes}/profiles`, {
      params: { ...filters }
    }).pipe(
      tap(profiles => console.log('API response:', profiles)), // Debug log
      catchError(error => {
        console.error('Error fetching profiles:', error); // Error log
        return throwError(() => error);
      })
    );
  }

  
  updateImages(userId: string, images: string[]): Observable<any> {
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
    return this.http.post<{ userlikes: number }>(`${profileRoutes}/${profileId}/like/user`, {});
  }

  private isProfileLikedAnonymously(profileId: string): boolean {
    const likedProfiles = this.getAnonymousLikedProfiles();
    return likedProfiles.includes(profileId);
  }

  private getAnonymousLikedProfiles(): string[] {
    const stored = localStorage.getItem(this.likedProfilesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private addAnonymousProfileLike(profileId: string) {
    const likedProfiles = this.getAnonymousLikedProfiles();
    if (!likedProfiles.includes(profileId)) {
      likedProfiles.push(profileId);
      localStorage.setItem(this.likedProfilesKey, JSON.stringify(likedProfiles));
    }
  }

  private getAnonymousId(): string {
    let id = localStorage.getItem(this.anonymousIdKey);
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem(this.anonymousIdKey, id);
    }
    return id;
  }

  addViewerLike(profileId: string): Observable<{ viewerlikes: number }> {
    // Check if already liked anonymously
    if (this.isProfileLikedAnonymously(profileId)) {
      return new Observable(subscriber => {
        subscriber.error({ message: 'You have already liked this profile' });
      });
    }

    const anonymousId = this.getAnonymousId();

    return this.http.post<{ viewerlikes: number; anonymousId: string }>(
      `${profileRoutes}/${profileId}/like/viewer`,
      { anonymousId }
    ).pipe(
      map(response => {
        if (!this.authService.getToken()) {
          this.addAnonymousProfileLike(profileId);
        }
        return { viewerlikes: response.viewerlikes };
      })
    );
  }

  updateField(fieldName: string, value: any): Observable<UserProfile> {
    console.log(`Updating field ${fieldName} with value:`, value);
    
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
}


