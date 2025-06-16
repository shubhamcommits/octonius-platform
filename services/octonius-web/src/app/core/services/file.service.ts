import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { File } from '../models/file.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  // File Operations
  getFiles(): Observable<File[]> {
    return this.http.get<File[]>(this.apiUrl);
  }

  uploadFile(file: globalThis.File): Observable<File> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<File>(`${this.apiUrl}/upload`, formData);
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  // Note Operations
  getNote(noteId: string): Observable<File> {
    return this.http.get<File>(`${this.apiUrl}/note/${noteId}`);
  }

  saveNote(note: Partial<File>, userId: string, workplaceId: string): Observable<File> {
    return this.http.post<File>(`${this.apiUrl}/note`, { ...note, user_id: userId, workplace_id: workplaceId });
  }
} 