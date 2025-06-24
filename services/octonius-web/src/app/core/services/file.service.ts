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
  getFiles(owner_id: string, workplace_id: string): Observable<File[]> {
    return this.http.get<File[]>(this.apiUrl, {
      params: {
        owner_id: owner_id,
        workplace_id: workplace_id
      }
    })
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

  saveNote(note: Partial<File>): Observable<File> {
    return this.http.post<File>(`${this.apiUrl}/note`, note);
  }
} 