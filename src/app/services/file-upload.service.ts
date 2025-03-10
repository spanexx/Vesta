import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { profileRoutes } from '../../environments/apiRoutes';

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
            const fileUrl = `${environment.baseUrl}/files/${filename}`;
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

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${profileRoutes}/upload`, formData)
      .pipe(
        map(response => response.file?.url || '')
      );
  }

  uploadVideo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${profileRoutes}/upload-video`, formData)
      .pipe(
        map(response => response.file?.url || '')
      );
  }
}
