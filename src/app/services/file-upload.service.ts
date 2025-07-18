import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { profileRoutes } from '../environments/apiRoutes';
import { AuthenticationService } from './authentication.service';
import { UserProfile } from '../models/userProfile.model';
import { environment } from '../environments/environment';

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
   */  uploadVerificationDocument(base64Data: string, filename: string, contentType: string, userId: string, side: 'front' | 'back'): Observable<{ verificationStatus: string; verificationDocuments: any[] }> {
    // Use the /api/media route which we know is available
    const url = `${this.apiUrl}/media/verification-documents/${userId}/${side}`;
    
    // Ensure contentType is not empty or undefined
    if (!contentType) {
      contentType = 'image/jpeg'; // Default to JPEG if no content type is provided
    }
    
    // Log detailed information
    console.log('Verification document upload parameters:', {
      userId,
      side,
      filename,
      contentType,
      base64Length: base64Data ? base64Data.length : 0,
      base64Sample: base64Data ? base64Data.substring(0, 50) + '...' : 'null'
    });
    
    // Ensure all required fields are present in the payload
    const payload = { 
      base64Data: base64Data, 
      filename: filename || `verification_${side}_${Date.now()}.jpg`, 
      contentType: contentType 
    };
    
    console.log('Sending payload with keys:', Object.keys(payload));
    
    return this.http.post<any>(url, payload).pipe(map(response => {
        console.log('Document upload response:', response);
        
        if (!response) {
          throw new Error('Invalid response from server during verification document upload.');
        }
        
        // The media API returns the full profile with verification data
        const verificationStatus = response.verificationStatus || 'pending';
        const verificationDocuments = response.verificationDocuments || [];
        
        return { 
          verificationStatus, 
          verificationDocuments
        };
      }),
      catchError(error => {
        console.error('Verification document upload error:', error);
        console.error('Error details:', error.error);
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
    return `${this.mediaBaseUrl}/${fileId}`;
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

