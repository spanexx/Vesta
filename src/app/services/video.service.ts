import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { videoRoutes } from '../../environments/apiRoutes';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';

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
  private likedVideosKey = 'anonymousLikedVideos';

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

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
      map(response => {
        const videos = response.videos;
        // Check local storage for anonymous likes
        if (!this.authService.getToken()) {
          const likedVideos = this.getAnonymousLikedVideos();
          return videos.map(video => ({
            ...video,
            isLiked: likedVideos.includes(video.videoId)
          }));
        }
        return videos;
      })
    );
  }

  likeVideo(videoId: string): Observable<{ likes: number; isLiked: boolean }> {
    // Check if already liked anonymously
    if (this.isVideoLikedAnonymously(videoId)) {
      return new Observable(subscriber => {
        subscriber.error({ message: 'You have already liked this video' });
      });
    }

    return this.http.post<{ success: boolean; likes: number; isLiked: boolean }>(
      `${videoRoutes}/${videoId}/like`, 
      {}
    ).pipe(
      map(response => {
        // Store anonymous like if successful
        if (!this.authService.getToken()) {
          this.addAnonymousLike(videoId);
        }
        return { 
          likes: response.likes, 
          isLiked: response.isLiked 
        };
      })
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

  private isVideoLikedAnonymously(videoId: string): boolean {
    const likedVideos = this.getAnonymousLikedVideos();
    return likedVideos.includes(videoId);
  }

  private getAnonymousLikedVideos(): string[] {
    const stored = localStorage.getItem(this.likedVideosKey);
    return stored ? JSON.parse(stored) : [];
  }

  private addAnonymousLike(videoId: string) {
    const likedVideos = this.getAnonymousLikedVideos();
    if (!likedVideos.includes(videoId)) {
      likedVideos.push(videoId);
      localStorage.setItem(this.likedVideosKey, JSON.stringify(likedVideos));
    }
  }
}
