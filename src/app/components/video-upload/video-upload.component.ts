import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { VideoService } from '../../services/video.service';
import { lastValueFrom } from 'rxjs';
import { AuthenticationService } from '../../services/authentication.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface SubscriberVideo {
  videoId: string;
  username: string;
  profilePicture: string | null;
  url: string;
  title: string;
  description: string;
  uploadedAt: Date;
}

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="video-upload-container">
      <h2>Upload Your Video</h2>
      
      <ng-container *ngIf="currentUser$ | async as currentUser; else loginRequired">
        <div *ngIf="!hasSubscription" class="subscription-notice">
          <p>You need an active video subscription to upload videos</p>
          <button (click)="subscribeToVideo()">Get Video Subscription</button>
        </div>

        <div *ngIf="hasSubscription" class="upload-section">
          <div *ngIf="currentVideo" class="current-video">
            <h3>Your Current Video</h3>
            <video controls>
              <source [src]="safeVideoUrl(currentVideo.url)" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <p>Title: {{currentVideo.title}}</p>
            <p>Uploaded: {{currentVideo.uploadedAt | date}}</p>
          </div>

          <div class="upload-form">
            <input type="file" 
                   accept="video/*"
                   (change)="onVideoSelected($event)"
                   #videoInput>
            <input type="text" 
                   [(ngModel)]="videoTitle" 
                   placeholder="Video title">
            <textarea [(ngModel)]="videoDescription" 
                      placeholder="Video description"></textarea>
            
            <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="progress-bar">
              <div class="progress" [style.width.%]="uploadProgress">
                {{uploadProgress}}%
              </div>
            </div>
            
            <button (click)="uploadVideo()" 
                    [disabled]="!selectedVideo || isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload Video' }}
            </button>
          </div>
        </div>
      </ng-container>

      <ng-template #loginRequired>
        <div class="login-notice">
          <p>Please login to upload videos</p>
          <button (click)="navigateToLogin()">Login</button>
        </div>
      </ng-template>
      
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <!-- All Videos Section -->
      <div class="all-videos-section">
        <h2>All Videos</h2>
        <div class="videos-grid">
          <div *ngFor="let video of allVideos" class="video-card">
            <div class="video-header">
              <img [src]="video.profilePicture || 'assets/default-avatar.png'" 
                   alt="Profile picture" 
                   class="profile-pic">
              <span class="username">{{video.username}}</span>
            </div>
            <video controls class="video-player">
              <source [src]="safeVideoUrl(video.url)" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <div class="video-info">
              <h3>{{video.title}}</h3>
              <p class="upload-date">{{video.uploadedAt | date}}</p>
              <p class="description">{{video.description}}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-upload-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .subscription-notice {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 20px 0;
    }
    .upload-section {
      margin-top: 20px;
    }
    .current-video video {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 8px;
    }
    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    input[type="text"], textarea {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    textarea {
      min-height: 100px;
      resize: vertical;
    }
    button {
      padding: 10px;
      background: #ea64b8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-message {
      color: red;
      margin-top: 10px;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress {
      height: 100%;
      background: linear-gradient(90deg, #ea64b8 0%, #ca49a2 100%);
      transition: width 0.3s ease;
      color: white;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
    }
    .login-notice {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 20px 0;
    }
    .all-videos-section {
      margin-top: 3rem;
      border-top: 1px solid #eee;
      padding-top: 2rem;
    }

    .videos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }

    .video-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .video-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .profile-pic {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .username {
      font-weight: 500;
      color: #333;
    }

    .video-player {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .video-info {
      padding: 1rem;
    }

    .video-info h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }

    .upload-date {
      color: #666;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .description {
      color: #444;
      font-size: 0.9rem;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class VideoUploadComponent implements OnInit {
  hasSubscription = false;
  currentVideo: any = null;
  selectedVideo: File | null = null;
  videoTitle = '';
  videoDescription = '';
  isUploading = false;
  error = '';
  uploadProgress = 0;
  currentUser$ = this.authService.currentUser$;
  allVideos: SubscriberVideo[] = [];

  constructor(
    private videoService: VideoService,
    private fileUploadService: FileUploadService,
    private router: Router,
    private authService: AuthenticationService,
    private sanitizer: DomSanitizer // Add this
  ) {}

  ngOnInit() {
    this.checkSubscription();
    this.getCurrentVideo();
    this.loadAllVideos();
  }

  checkSubscription() {
    this.videoService.checkSubscription()
      .subscribe({
        next: (res) => {
          this.hasSubscription = res.isSubscribed;
        },
        error: (err) => {
          this.error = 'Failed to check subscription status';
          console.error(err);
        }
      });
  }

  getCurrentVideo() {
    this.videoService.getCurrentVideo()
      .subscribe({
        next: (res) => {
          this.currentVideo = res.subscriberVideo;
        },
        error: (err) => {
          this.error = 'Failed to get current video';
          console.error(err);
        }
      });
  }

  onVideoSelected(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedVideo = files[0];
    }
  }

  async uploadVideo() {
    if (!this.selectedVideo) return;

    this.isUploading = true;
    this.error = '';
    this.uploadProgress = 0;

    try {
      // First upload the file to get the URL
      const uploadResult = await new Promise<{ url: string }>((resolve, reject) => {
        this.fileUploadService
          .uploadFile(this.selectedVideo as File)
          .subscribe({
            next: (event: any) => {
              if ('progress' in event) {
                this.uploadProgress = event.progress;
              } else if ('url' in event) {
                resolve(event);
              }
            },
            error: reject
          });
      });

      if (!uploadResult.url) {
        throw new Error('No URL received from file upload');
      }

      // Create payload for subscriber video
      const videoPayload = {
        videoUrl: uploadResult.url,
        title: this.videoTitle || 'Untitled',
        description: this.videoDescription || ''
      };

      // Then create the subscriber video with the URL
      const response = await lastValueFrom(
        this.videoService.uploadSubscriberVideo(videoPayload)
      );

      // Reset form and refresh current video
      this.selectedVideo = null;
      this.videoTitle = '';
      this.videoDescription = '';
      this.uploadProgress = 0;
      this.getCurrentVideo();
      this.loadAllVideos(); // Refresh the videos list after upload

    } catch (err: any) {
      this.error = err.message || 'Failed to upload video';
      console.error('Upload error:', err);
    } finally {
      this.isUploading = false;
    }
  }

  subscribeToVideo() {
    this.router.navigate(['/pricing'], { 
      queryParams: { plan: 'video' }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/video-upload' }
    });
  }

  loadAllVideos() {
    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        this.allVideos = videos;
      },
      error: (err) => {
        console.error('Error loading videos:', err);
        this.error = 'Failed to load videos';
      }
    });
  }

  safeVideoUrl(url: string): SafeResourceUrl {
    if (!url) return '';
    
    // Handle both relative and absolute URLs
    let fullUrl;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else {
      // Extract filename and construct full URL
      const filename = url.split('/').pop();
      fullUrl = `${environment.baseUrl}/files/${filename}`;
    }
    
    // Use bypassSecurityTrustResourceUrl for video sources
    return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }
}
