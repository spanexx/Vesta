import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      <div class="skeleton-header">
        <div class="skeleton-avatar pulse"></div>
        <div class="skeleton-info">
          <div class="skeleton-text pulse"></div>
          <div class="skeleton-text small pulse"></div>
        </div>
      </div>
      <div class="skeleton-gallery">
        <div class="skeleton-image pulse" *ngFor="let i of [1,2,3,4]"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-text pulse"></div>
        <div class="skeleton-text pulse"></div>
        <div class="skeleton-text small pulse"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .skeleton-header {
      display: flex;
      gap: 2rem;
      margin-bottom: 3rem;
      align-items: center;
    }

    .skeleton-avatar {
      width: 150px;
      height: 150px;
      border-radius: 20%;
      background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
      background-size: 200% 100%;
    }

    .skeleton-info {
      flex: 1;
    }

    .skeleton-text {
      height: 24px;
      background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
      background-size: 200% 100%;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .skeleton-text.small {
      width: 60%;
      height: 16px;
    }

    .skeleton-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .skeleton-image {
      aspect-ratio: 1;
      background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
      background-size: 200% 100%;
      border-radius: 12px;
    }

    .pulse {
      animation: shimmer 2s infinite linear;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `]
})
export class ProfileSkeletonComponent {}
