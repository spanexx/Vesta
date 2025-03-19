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
        this.userId = user._id; // Store userId when user logs in
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
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedVideo);

      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      const response = await lastValueFrom(
        this.fileUploadService.uploadSubscriberVideo(
          result,
          this.videoTitle || this.selectedVideo.name,
          this.selectedVideo.type,
          this.userId // Use stored userId instead of accessing from Observable
        )
      );

      if (response.success) {
        // Reset form and refresh
        this.selectedVideo = null;
        this.videoTitle = '';
        this.videoDescription = '';
        this.uploadProgress = 100;
        this.getCurrentVideo();
        this.loadAllVideos();

        this.snackBar.open('Video uploaded successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      } else {
        throw new Error(response.error || 'Failed to upload video');
      }

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

  getVideoUrl(videoId: string): SafeResourceUrl {
    if (!videoId) return '';
    const url = this.fileUploadService.getMediaUrl(videoId);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
