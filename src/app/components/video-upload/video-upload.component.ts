import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { VideoService } from '../../services/video.service';
import { lastValueFrom } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';
import { SubscriberVideo } from '../../models/subscriberVideo.model';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './video-upload.component.html',
    styleUrls: ['./video-upload.component.css']
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
  userId = ""

  constructor(
    private videoService: VideoService,
    private fileUploadService: FileUploadService,
    private router: Router,
    private authService: AuthenticationService,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Subscribe to auth state
    this.currentUser$.subscribe(user => {
      if (user) {
        // Only check subscription and video for logged in users
        this.checkSubscription();
        this.getCurrentVideo();
      }
    });
    
    this.loadAllVideos(); // This can still load for all users
  }

  checkSubscription() {
      console.log('User:', this.currentUser$);
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
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileService.getProfileById(user._id).subscribe({
          next: (profile) => {
            console.log('Profile:', profile);
            if (profile.profileLevel === 'free') {
              this.snackBar.open(
                'You are currently on a Free Plan. Upgrade to subscribe to video content', 'Close', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['error-snackbar']
              });
              this.router.navigate(['/pricing'], {
                // queryParams: { message: 'You need to upgrade your profile to subscribe to video content' }
              });
            } else {
              this.router.navigate(['/video-payment'], {
                queryParams: { plan: 'video' }
              });
            }
          },
          error: (err) => {}
        });
      }});
    // this.router.navigate(['/video-payment'], { 
    //   queryParams: { plan: 'video' }
    // });
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

  toggleLike(video: SubscriberVideo) {
    if (video.isLiked) {
      // Only allow unlike for authenticated users
      if (!this.authService.getToken()) {
        return;
      }
      this.videoService.unlikeVideo(video.videoId).subscribe({
        next: (response) => {
          video.likes = response.likes;
          video.isLiked = response.isLiked;
        },
        error: (err) => {
          console.error('Error unliking video:', err);
        }
      });
    } else {
      this.videoService.likeVideo(video.videoId).subscribe({
        next: (response) => {
          video.likes = response.likes;
          video.isLiked = response.isLiked;
        },
        error: (err) => {
          if (err.message === 'You have already liked this video') {
            // Show feedback to user that they've already liked the video
            this.error = err.message;
          } else {
            console.error('Error liking video:', err);
          }
        }
      });
    }
  }
}
