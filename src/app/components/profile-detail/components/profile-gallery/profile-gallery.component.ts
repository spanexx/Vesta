import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-profile-gallery',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <div class="gallery-sections">
      <!-- Images Section -->
      <section class="images-section" *ngIf="images?.length">
        <h3>Photos</h3>
        <div class="gallery-grid">
          <div *ngFor="let image of images" 
               class="gallery-item"
               (click)="onImageClick(image)">
            <img [src]="image"  [alt]="'Gallery image'">
            <button *ngIf="isCurrentUser" 
                    class="delete-button" 
                    (click)="onDeleteImage(image); $event.stopPropagation()">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Videos Section -->
      <section class="videos-section" *ngIf="videos?.length">
        <h3>Videos</h3>
        <div class="gallery-grid">
          <div *ngFor="let video of videos" class="gallery-item video-item">
            <video controls preload="none">
              <source [src]="video" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <button *ngIf="isCurrentUser" 
                    class="delete-button" 
                    (click)="onDeleteVideo(video)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .gallery-viewport {
      height: 600px;
      width: 100%;
      overflow-x: hidden;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 1rem;
    }

    .gallery-item {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
      position: relative;
    }

    .gallery-item:hover {
      transform: scale(1.02);
    }

    .gallery-item img, 
    .gallery-item video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gallery-sections {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .images-section,
    .videos-section {
      h3 {
        color: #ea64b8;
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
    }

    .video-item {
      aspect-ratio: 16/9;
    }

    .video-item video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
    }

    .delete-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .delete-button:hover {
      background: rgba(255, 0, 0, 0.9);
      transform: scale(1.1);
    }
  `]
})
export class ProfileGalleryComponent {
  @Input() images: string[] = [];
  @Input() videos: string[] = [];
  @Input() isCurrentUser: boolean = false;
  @Input() canUpload: boolean = true; // Add this line

  @Output() mediaClick = new EventEmitter<string>();
  @Output() deleteImage = new EventEmitter<string>();
  @Output() deleteVideo = new EventEmitter<string>();

  get combinedMedia(): string[] {
    // Keep images and videos separate instead of combining them
    return [...(this.images || []), ...(this.videos || [])];
  }

  isImage(url: string): boolean {
    // First check if the URL is in the images array
    if (this.images?.includes(url)) return true;
    
    // Then check the file extension as fallback
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return extensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  onMediaClick(url: string): void {
    this.mediaClick.emit(url);
  }

  onImageClick(imageUrl: string): void {
    this.mediaClick.emit(imageUrl);
  }

  onDeleteImage(imageUrl: string): void {
    this.deleteImage.emit(imageUrl);
  }

  onDeleteVideo(videoUrl: string): void {
    this.deleteVideo.emit(videoUrl);
  }
}
