import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { UserProfile } from '../interfaces/profile.interface';
import { profileRoutes } from '../../environments/apiRoutes';

export interface LocationFilter {
  country?: string;
  city?: string;
}

export interface ProfileQueryParams {
  viewerLocation?: string;
  coordinates?: number[];
  age?: number;
  services?: string;
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
    return this.http.get<UserProfile[]>(`${profileRoutes}/profiles`, {
      params: { ...filters }
    });
  }

  updateProfilePicture(pictureUrl: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${profileRoutes}/profile-picture`, { pictureUrl });
  }

  updateProfileVideos(videos: string[]): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${profileRoutes}/videos`, { videos });
  }

  updateProfileImages(images: string[]): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${profileRoutes}/images`, { images });
  }
}
