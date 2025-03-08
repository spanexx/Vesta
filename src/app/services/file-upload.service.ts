import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { profileRoutes } from '../../environments/apiRoutes';

interface UploadResponse {
  success: boolean;
  file?: { 
    filename: string;
    url: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${profileRoutes}/upload`, formData);
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
