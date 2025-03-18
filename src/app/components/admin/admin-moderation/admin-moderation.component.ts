import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { UserFileResponse } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="moderation-container">
      <h2>Content Moderation</h2>
      
      <div class="content-grid">
        <div *ngFor="let user of userFiles" class="content-card">
          <div class="user-info">
            <h3>{{user.username}}</h3>
            <p>{{user.email}}</p>
          </div>
          
          <div class="media-section" *ngIf="user.images.length > 0">
            <h4>Images ({{user.images.length}})</h4>
            <div class="media-grid">
              <div *ngFor="let image of user.images" class="media-item">
                <img [src]="image" alt="User content">
                <button (click)="deleteFile(user.username, 'images', image)" class="delete-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="media-section" *ngIf="user.videos.length > 0">
            <h4>Videos ({{user.videos.length}})</h4>
            <div class="media-grid">
              <div *ngFor="let video of user.videos" class="media-item">
                <video [src]="video" controls></video>
                <button (click)="deleteFile(user.username, 'videos', video)" class="delete-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="media-section" *ngIf="user.verificationDocuments.length > 0">
            <h4>Verification Documents</h4>
            <div class="media-grid">
              <div *ngFor="let doc of user.verificationDocuments" class="media-item">
                <img [src]="doc" alt="Verification document">
                <button (click)="deleteFile(user.username, 'documents', doc)" class="delete-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .moderation-container {
      padding: 2rem;
    }

    h2 {
      color: var(--text);
      margin-bottom: 2rem;
    }

    .content-grid {
      display: grid;
      gap: 2rem;
    }

    .content-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: var(--card-shadow);
    }

    .user-info {
      margin-bottom: 1.5rem;
    }

    .user-info h3 {
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .user-info p {
      color: var(--text-secondary);
    }

    .media-section {
      margin-top: 1.5rem;
    }

    .media-section h4 {
      color: var(--text);
      margin-bottom: 1rem;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .media-item {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
    }

    .media-item img,
    .media-item video {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .delete-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.5rem;
      background: var(--error);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition);
    }

    .delete-btn:hover {
      opacity: 0.9;
    }
  `]
})
export class AdminModerationComponent implements OnInit {
  userFiles: UserFileResponse[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUserFiles();
  }

  private loadUserFiles(): void {
    this.adminService.getUserFiles().subscribe({
      next: (files) => this.userFiles = files,
      error: (error) => console.error('Failed to load user files:', error)
    });
  }

  deleteFile(userId: string, fileType: 'images' | 'videos' | 'documents', fileId: string): void {
    if (confirm('Are you sure you want to delete this file?')) {
      this.adminService.deleteUserFile(userId, fileType, fileId).subscribe({
        next: () => this.loadUserFiles(), // Reload files after deletion
        error: (error) => console.error('Failed to delete file:', error)
      });
    }
  }
}
