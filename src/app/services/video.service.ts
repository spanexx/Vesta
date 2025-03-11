import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { videoRoutes } from '../../environments/apiRoutes';
import { environment } from '../../environments/environment';

interface VideoSubscriptionStatus {
  videoSubscription?: {
    isSubscribed: boolean;
    subscribedAt: Date;
    expiresAt: Date;
  };
}

interface VideoUploadPayload {
  videoUrl: string;
  title?: string;
  description?: string;
}

interface SubscriberVideo {
  videoId: string;
  username: string;
  profilePicture: string | null;
  url: string;
  title: string;
  description: string;
  uploadedAt: Date;
  likes: number;
  isLiked: boolean;
}

interface VideoResponse {
  success: boolean;
  videos: SubscriberVideo[];
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  constructor(private http: HttpClient) {}

  checkSubscription(): Observable<{ isSubscribed: boolean }> {
    return this.http.get<VideoSubscriptionStatus>(`${videoRoutes}/subscription-status`).pipe(
      map(response => ({
        isSubscribed: response?.videoSubscription?.isSubscribed || false
      }))
    );
  }

  getCurrentVideo(): Observable<any> {
    return this.http.get(`${videoRoutes}/subscriber-video`);
  }

  uploadSubscriberVideo(payload: VideoUploadPayload): Observable<any> {
    // Ensure the URL is using the full path if it's a relative URL
    if (payload.videoUrl && !payload.videoUrl.startsWith('http')) {
      payload.videoUrl = `${environment.baseUrl}/${payload.videoUrl.replace(/^\/+/, '')}`;
    }
    return this.http.post(`${videoRoutes}/subscriber-video`, payload);
  }

  getAllVideos(): Observable<SubscriberVideo[]> {
    return this.http.get<VideoResponse>(`${videoRoutes}/all-videos`).pipe(
      map(response => response.videos)
    );
  }

  likeVideo(videoId: string): Observable<{ likes: number; isLiked: boolean }> {
    return this.http.post<{ success: boolean; likes: number; isLiked: boolean }>(
      `${videoRoutes}/${videoId}/like`, 
      {}
    ).pipe(
      map(response => ({ 
        likes: response.likes, 
        isLiked: response.isLiked 
      }))
    );
  }

  unlikeVideo(videoId: string): Observable<{ likes: number; isLiked: boolean }> {
    return this.http.post<{ success: boolean; likes: number; isLiked: boolean }>(
      `${videoRoutes}/${videoId}/unlike`, 
      {}
    ).pipe(
      map(response => ({ 
        likes: response.likes, 
        isLiked: response.isLiked 
      }))
    );
  }
}
