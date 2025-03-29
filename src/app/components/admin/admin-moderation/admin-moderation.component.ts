import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { UserFileResponse } from '../../../models/admin.model';
import { UserProfile } from '../../../models/userProfile.model';
import { FileUploadService } from '../../../services/file-upload.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

interface ModerationFlags {
  contentWarnings: number;
  reviewerNotes: string;
  lastReviewed: Date;
  flaggedMedia?: { mediaId: string; mediaType: 'image' | 'video'; flaggedAt: Date }[];
}

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
    templateUrl: './admin-moderation.component.html',
    styleUrls: ['./admin-moderation.component.scss'],
})
export class AdminModerationComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  userFiles: UserProfile[] = [];
  selectedUser: UserProfile | null = null;
  isFormVisible = false;
  expandedUsers: { [key: string]: boolean } = {};
  error: string | null = null;
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.loadUserFiles();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadUserFiles(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;
    
    this.subscriptions.add(
      this.adminService.getUserFiles().pipe(
        take(1),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (files) => {
          console.log('User files loaded:', files);
          // Initialize moderation flags for each user if they don't exist
          this.userFiles = files.map(user => ({
            ...user,
            moderationFlags: user.moderationFlags || {
              contentWarnings: 0,
              reviewerNotes: '',
              lastReviewed: new Date()
            }
          }));
        },
        error: (error) => {
          console.error('Failed to load user files:', error);
          this.error = 'Failed to load user files. Please try again.';
        }
      })
    );
  }

  deleteFile(userId: string, fileType: 'images' | 'videos' | 'documents', fileId: string): void {
    if (confirm('Are you sure you want to delete this file?')) {
      this.subscriptions.add(
        this.adminService.deleteUserFile(userId, fileType, fileId).subscribe({
          next: () => this.loadUserFiles(), // Reload files after deletion
          error: (error) => console.error('Failed to delete file:', error)
        })
      );
    }
  }

  updateFlags(userId: string): void {
    const user = this.userFiles.find(u => u.username === userId);
    if (!user) return;

    const flags = {
      contentWarnings: user.moderationFlags?.contentWarnings,
      reviewerNotes: user.moderationFlags?.reviewerNotes,
      lastReviewed: new Date()
    };

    this.subscriptions.add(
      this.adminService.updateModerationFlags(userId, flags).subscribe({
        next: () => {
          // Optionally show success message
          console.log('Moderation flags updated successfully');
        },
        error: (error) => console.error('Failed to update moderation flags:', error)
      })
    );
  }

  getMedia(fileId: string): string {
    return this.fileUploadService.getMediaUrl(fileId);
  }

  // Helper method to safely get moderation flags
  getModerationFlags(user: any) {
    if (!user.moderationFlags) {
      user.moderationFlags = {
        contentWarnings: 0,
        reviewerNotes: '',
        lastReviewed: new Date()
      };
    }
    return user.moderationFlags;
  }

  updateModeration(): void {
    if (!this.selectedUser?._id || !this.selectedUser?.moderationFlags) return;

    const flags: ModerationFlags = {
      contentWarnings: this.selectedUser.moderationFlags.contentWarnings || 0,
      reviewerNotes: this.selectedUser.moderationFlags.reviewerNotes || '',
      lastReviewed: this.selectedUser.moderationFlags.lastReviewed || new Date()
    };

    this.subscriptions.add(
      this.adminService.updateModerationFlags(this.selectedUser._id, flags).subscribe({
        next: (updatedUser) => {
          console.log('Moderation flags updated successfully', updatedUser);
          this.loadUserFiles();
          this.closeForm();
        },
        error: (error) => {
          console.error('Failed to update moderation flags:', error);
        }
      })
    );
  }

  flagMedia(user: UserProfile, mediaId: string, mediaType: 'image' | 'video'): void {
    if (!user._id || !user.moderationFlags) return;

    const flags = {
      ...user.moderationFlags,
      flaggedMedia: [
        ...(user.moderationFlags.flaggedMedia || []),
        {
          mediaId,
          mediaType,
          flaggedAt: new Date()
        }
      ]
    };

    this.subscriptions.add(
      this.adminService.updateModerationFlags(user._id, flags).subscribe({
        next: (updatedUser) => {
          console.log('Media flagged successfully', updatedUser);
          this.loadUserFiles();
        },
        error: (error) => console.error('Failed to flag media:', error)
      })
    );
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;
    const parts = dateString.split('-');
    if (parts.length !== 3) return undefined;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  onLastReviewedChange(user: any, dateString: string): void {
    const parsedDate = this.parseDate(dateString);
    if (parsedDate) {
      user.moderationFlags.lastReviewed = parsedDate;
    }
  }

  selectUser(user: UserProfile): void {
    this.selectedUser = user;
    this.isFormVisible = true;
  }

  closeForm(): void {
    this.selectedUser = null;
    this.isFormVisible = false;
  }

  toggleUser(username: string): void {
    this.expandedUsers[username] = !this.expandedUsers[username];
  }

  isExpanded(username: string): boolean {
    return !!this.expandedUsers[username];
  }
}
