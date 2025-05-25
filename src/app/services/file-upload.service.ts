import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { profileRoutes } from '../../environments/apiRoutes';
import { AuthenticationService } from './authentication.service';
import { UserProfile } from '../models/userProfile.model';

interface UploadResponse {
  success: boolean;
  file?: { 
    filename: string;
    url: string;
    mimetype: string;
    originalname: string;
  };
  message: string;
}

interface ProfilePictureResponse {
  success: boolean;
  message?: string;
  error?: string;
  fileId?: string;
  profile?: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {  private apiUrl = environment.apiUrl;
  private mediaBaseUrl = environment.mediaUrl; // Use mediaUrl from environment
  private baseUrl = environment.baseUrl; // Use baseUrl directly from environment
  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<{ progress: number } | { url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${profileRoutes}/upload`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'json' as 'json',
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = Math.round(100 * (event.loaded / (event.total || event.loaded)));
            return { progress };
          case HttpEventType.Response:
            if (!event.body?.success) {
              throw new Error(event.body?.message || 'Upload failed');
            }
            // Return full URL path
            const filename = event.body.file?.filename;
            const fileUrl = `${this.baseUrl}/files/${filename}`;
            return { url: fileUrl };
          default:
            return { progress: 0 };
        }
      })
    );
  }

  uploadMultipleFiles(files: File[]): Observable<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<{ urls: string[] }>(`${profileRoutes}/uploads`, formData);
  }

  /**
   * Uploads an image to the server.
   * Expects base64Data, original filename, MIME type and the user ID.
   */
  uploadImage(base64Data: string, filename: string, contentType: string, userId: string) {
    const payload = { base64Data, filename, contentType, userId };
    console.log('payload', payload);
    return this.http.post(`${this.mediaBaseUrl}/upload-images`, payload);
  }

  /**
   * Upload a video file
   */
  uploadVideo(base64Data: string, filename: string, contentType: string, userId: string) {
    const payload = { base64Data, filename, contentType, userId };
console.log('payload', payload);
console.log('payload', payload);
    return this.http.post(`${this.mediaBaseUrl}/upload-video`, payload);
  }

  /**
   * Upload a subscriber video file
   */
  uploadSubscriberVideo(base64Data: string, filename: string, contentType: string, userId: string): Observable<any> {
    const payload = { base64Data, filename, contentType, userId };
    return this.http.post(`${this.mediaBaseUrl}/video-upload-subscriber`, payload);
  }

  /**
   * Upload verification document
   */
  uploadVerificationDocument(base64Data: string, filename: string, contentType: string, userId: string, side: 'front' | 'back'): Observable<{ verificationStatus: string; verificationDocuments: any[] }> {
    // The backend route is POST /users/:userId/verification-document-base64
    // Assuming identityVerification.js routes are mounted under '/api/identity'
    const url = `${this.apiUrl}/identity/users/${userId}/verification-document-base64`;
    const payload = { base64Data, filename, contentType, side };

    return this.http.post<{ message: string; verificationStatus: string; documents: any[] }>(url, payload).pipe(
      map(response => {
        if (!response || !response.verificationStatus || !response.documents) {
          throw new Error('Invalid response from server during verification document upload.');
        }
        return { 
          verificationStatus: response.verificationStatus, 
          verificationDocuments: response.documents 
        };
      }),
      catchError(error => {
        console.error('Verification document upload error:', error);
        // Rethrow a more specific error or the original error
        return throwError(() => new Error(error.error?.message || 'Failed to upload verification document.'));
      })
    );
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(base64Data: string, filename: string, contentType: string, userId: string): Observable<UserProfile> {
    const payload = { base64Data, filename, contentType };
    return this.http.post<UserProfile>(`${this.mediaBaseUrl}/profile-picture/${userId}`, payload)
      .pipe(
        map(response => {
          if (!response) {
            throw new Error('No profile returned from server');
          }
          return response;
        })
      );
  }

  /**
   * Delete a media file by its ID.
   * @param fileId The ID of the file to delete
   * @returns Observable of the delete response
   */
  deleteMedia(fileId: string): Observable<any> {
    return this.http.delete(`${this.mediaBaseUrl}/${fileId}`);
  }

  /**
   * Returns the URL for a given media file ID.
   */
  getMediaUrl(fileId: string): string {
    return `${this.baseUrl}/media/${fileId}`;
  }

  uploadPaymentSlip(base64Data: string, filename: string, contentType: string): Observable<any> {
    return this.http.post(`${this.mediaBaseUrl}/payment-slip`, {
      base64Data,
      filename,
      contentType
    }).pipe(
      catchError(error => {
        console.error('Payment slip upload error:', error);
        throw error;
      })
    );
  }
}
