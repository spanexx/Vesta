import { authRoutes } from './../../environments/apiRoutes';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
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
    return this.http.get<UserProfile[]>(`${authRoutes}/profiles`, {
      params: { ...filters }
    });
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

  addViewerLike(profileId: string): Observable<{ viewerlikes: number }> {
    return this.http.post<{ viewerlikes: number }>(`${profileRoutes}/${profileId}/like/viewer`, {});
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


