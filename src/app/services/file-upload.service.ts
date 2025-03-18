import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { profileRoutes } from '../../environments/apiRoutes';
import { AuthenticationService } from './authentication.service';

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

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl;
  private mediaBaseUrl = `${environment.baseUrl}/media`; // Update to match server endpoint
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
   * Uploads a video to the server.
   * Expects base64Data, original filename, MIME type and the user ID.
   */
  uploadVideo(base64Data: string, filename: string, contentType: string, userId: string) {
    const payload = { base64Data, filename, contentType, userId };
    console.log('payload', payload);
    return this.http.post(`${this.mediaBaseUrl}/upload-video`, payload);
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
}
