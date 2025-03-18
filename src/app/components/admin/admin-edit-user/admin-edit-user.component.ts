import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfile } from '../../../models/userProfile.model';
import { FileUploadService } from '../../../services/file-upload.service';

@Component({
  selector: 'app-admin-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-edit-user.component.html',
  styleUrls: ['./admin-edit-user.component.css']

})
export class AdminEditUserComponent implements OnInit {
  userForm: FormGroup;
  isLoading = false;
  isSaving = false;
  error = '';
  userId!: string;
  profile: UserProfile | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: [''],
      email: [''],
      profileLevel: [''],
      status: [''],
      verificationStatus: [''],
      contentWarnings: [''],
      reviewerNotes: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['userId'];
    this.loadUser();
  }

  private loadUser(): void {
    this.isLoading = true;
    this.adminService.getAllProfiles().subscribe({
      next: (users) => {
        const user = users.find(u => u._id === this.userId);
        if (user) {
          this.profile = user; // Add this line to store the profile
          this.userForm.patchValue({
            username: user.username,
            email: user.email,
            profileLevel: user.profileLevel,
            status: user.status,
            verificationStatus: user.verificationStatus,
            contentWarnings: user.moderationFlags?.contentWarnings,
            reviewerNotes: user.moderationFlags?.reviewerNotes
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load user';
        this.isLoading = false;
      }
    });
  }

  getMediaUrl(fileId: string): string {
    // Add null check
    if (!fileId) {
      return '';
    }
    return this.fileUploadService.getMediaUrl(fileId);
  }

  openPreview(fileId: string): void {
    // Add null check
    if (!fileId) {
      return;
    }
    this.previewUrl = this.getMediaUrl(fileId);
  }

  closePreview(): void {
    this.previewUrl = null;
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const updateData = {
      ...this.userForm.value,
      moderationFlags: {
        contentWarnings: this.userForm.value.contentWarnings,
        reviewerNotes: this.userForm.value.reviewerNotes,
        lastReviewed: new Date()
      }
    };

    this.adminService.updateUserProfile(this.userId, updateData).subscribe({
      next: () => {
        this.router.navigate(['/admin/users']);
      },
      error: (error) => {
        this.error = error.message || 'Failed to update user';
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
