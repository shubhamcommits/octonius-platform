import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { File, UploadIntentRequest, UploadIntentResponse, CompleteUploadRequest, FileDownloadUrlResponse } from '../models/file.model';
import { environment } from '../../../environments/environment';
import { map, catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  // File Operations for MySpace (private group files)
  getMySpaceFiles(): Observable<File[]> {
    return this.http.get<any>(`${this.apiUrl}/myspace`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching MySpace files:', error);
        return throwError(() => error);
      })
    );
  }

  // File Operations for Groups
  getFiles(user_id: string, workplace_id: string, group_id?: string): Observable<File[]> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('workplace_id', workplace_id);
    
    if (group_id) {
      params = params.set('group_id', group_id);
    }
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching files:', error);
        return throwError(() => error);
      })
    );
  }

  // Get files for a specific group
  getGroupFiles(group_id: string): Observable<File[]> {
    const params = new HttpParams().set('group_id', group_id);
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching group files:', error);
        return throwError(() => error);
      })
    );
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Note Operations
  getNote(noteId: string): Observable<File> {
    return this.http.get<any>(`${this.apiUrl}/note/${noteId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Note not found');
      }),
      catchError(error => {
        console.error('Error fetching note:', error);
        return throwError(() => error);
      })
    );
  }

  saveNote(note: Partial<File>): Observable<File> {
    return this.http.post<any>(`${this.apiUrl}/note`, note).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Save failed');
      }),
      catchError(error => {
        console.error('Error saving note:', error);
        return throwError(() => error);
      })
    );
  }

  createNote(noteData: { name: string; title?: string; content?: any; group_id?: string }): Observable<File> {
    return this.http.post<any>(`${this.apiUrl}/note`, noteData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Note creation failed');
      }),
      catchError(error => {
        console.error('Error creating note:', error);
        return throwError(() => error);
      })
    );
  }

  createMySpaceNote(noteData: { name: string; title?: string; content?: any }): Observable<File> {
    // For MySpace notes, don't specify group_id - backend will use private group
    return this.createNote(noteData);
  }

  createGroupNote(noteData: { name: string; title?: string; content?: any; group_id: string }): Observable<File> {
    // For group notes, specify the group_id
    return this.createNote(noteData);
  }

  updateNote(noteId: string, noteData: Partial<File>): Observable<File> {
    return this.http.put<any>(`${this.apiUrl}/note/${noteId}`, noteData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Note update failed');
      }),
      catchError(error => {
        console.error('Error updating note:', error);
        return throwError(() => error);
      })
    );
  }

  // S3 Upload Methods

  /**
   * Create upload intent for S3 direct upload
   */
  createUploadIntent(request: UploadIntentRequest): Observable<UploadIntentResponse> {
    return this.http.post<UploadIntentResponse>(`${this.apiUrl}/upload-intent`, request).pipe(
      catchError(error => {
        console.error('Error creating upload intent:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  uploadToS3(uploadUrl: string, file: globalThis.File): Observable<void> {
    return from(
      fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      }).then(response => {
        if (!response.ok) {
          throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
        }
      })
    );
  }

  /**
   * Complete file upload after S3 upload success
   */
  completeFileUpload(request: CompleteUploadRequest): Observable<File> {
    return this.http.post<any>(`${this.apiUrl}/complete-upload`, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Upload completion failed');
      }),
      catchError(error => {
        console.error('Error completing file upload:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Complete S3 upload process - combines all steps
   */
  uploadFileViaS3(file: globalThis.File, group_id?: string): Observable<File> {
    const uploadIntent: UploadIntentRequest = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      group_id
    };

    return this.createUploadIntent(uploadIntent).pipe(
      switchMap(intentResponse => {
        // Upload to S3
        return this.uploadToS3(intentResponse.data.upload_url, file).pipe(
          switchMap(() => {
            // Complete upload
            const completeRequest: CompleteUploadRequest = {
              file_key: intentResponse.data.file_key,
              file_name: intentResponse.data.metadata.file_name,
              file_type: intentResponse.data.metadata.file_type,
              file_size: intentResponse.data.metadata.file_size,
              group_id: intentResponse.data.metadata.resolved_group_id
            };
            return this.completeFileUpload(completeRequest);
          })
        );
      }),
      catchError(error => {
        console.error('Error in S3 upload process:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get download URL for a file (both secure and CDN URLs)
   */
  getFileDownloadUrl(fileId: string): Observable<FileDownloadUrlResponse> {
    return this.http.get<FileDownloadUrlResponse>(`${this.apiUrl}/${fileId}/download-url`).pipe(
      catchError(error => {
        console.error('Error getting download URL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Download file using secure URL
   */
  downloadFileSecure(fileId: string): Observable<{ blob: Blob; fileName: string; cdnUrl?: string }> {
    return this.getFileDownloadUrl(fileId).pipe(
      switchMap(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to get download URL');
        }

        if (response.data.type === 'note') {
          // For notes, return content as JSON blob
          const content = JSON.stringify(response.data.content, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          return [{ blob, fileName: `${response.data.file_name}.json` }];
        } else if (response.data.download_url) {
          // For files, fetch using secure URL
          return this.http.get(response.data.download_url, { responseType: 'blob' }).pipe(
            map(blob => ({
              blob,
              fileName: response.data.file_name,
              cdnUrl: response.data.cdn_url
            })),
            catchError(downloadError => {
              console.error('Error fetching file from download URL:', {
                url: response.data.download_url,
                error: downloadError,
                status: downloadError.status,
                statusText: downloadError.statusText,
                errorBlob: downloadError.error
              });
              
              // Try to read the error response (might be XML from S3)
              if (downloadError.error instanceof Blob) {
                return from(downloadError.error.text()).pipe(
                  switchMap((errorText: unknown) => {
                    const errorString = String(errorText);
                    console.error('S3 Error Response:', errorString);
                    let errorMessage = `Failed to download file (${downloadError.status})`;
                    
                    // Try to parse XML error from S3
                    if (errorString && errorString.includes('<Error>')) {
                      const codeMatch = errorString.match(/<Code>(.*?)<\/Code>/);
                      const messageMatch = errorString.match(/<Message>(.*?)<\/Message>/);
                      if (codeMatch && messageMatch) {
                        errorMessage = `S3 Error: ${codeMatch[1]} - ${messageMatch[1]}`;
                      }
                    }
                    
                    throw new Error(errorMessage);
                  }),
                  catchError(() => {
                    throw new Error(`Failed to download file: ${downloadError.status} ${downloadError.statusText}`);
                  })
                );
              } else {
                throw new Error(`Failed to download file: ${downloadError.status || downloadError.message}`);
              }
            })
          );
        } else {
          throw new Error('No download URL available for this file');
        }
      }),
      catchError(error => {
        console.error('Error in secure download process:', error);
        
        // Provide more detailed error information
        let errorMessage = 'Failed to download file';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status) {
          errorMessage = `Server error (${error.status}): ${error.statusText || 'Unknown error'}`;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Get CDN URL for public file access (images, etc.)
   */
  getCdnUrl(fileId: string): Observable<string | null> {
    return this.getFileDownloadUrl(fileId).pipe(
      map(response => response.data.cdn_url || null),
      catchError(error => {
        console.error('Error getting CDN URL:', error);
        return throwError(() => error);
      })
    );
  }

  // Legacy upload method (kept for backward compatibility)
  uploadFile(file: globalThis.File, group_id?: string): Observable<File> {
    const formData = new FormData();
    formData.append('file', file);
    if (group_id) {
      formData.append('group_id', group_id);
    }
    
    return this.http.post<any>(`${this.apiUrl}/upload`, formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Upload failed');
      }),
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility methods for group-based operations

  /**
   * Upload to MySpace using S3 (recommended)
   */
  uploadMySpaceFileS3(file: globalThis.File): Observable<File> {
    return this.uploadFileViaS3(file);
  }

  /**
   * Upload to group using S3 (recommended)
   */
  uploadGroupFileS3(file: globalThis.File, group_id: string): Observable<File> {
    return this.uploadFileViaS3(file, group_id);
  }

  /**
   * Upload to MySpace using legacy method
   */
  uploadMySpaceFile(file: globalThis.File): Observable<File> {
    return this.uploadFile(file);
  }

  /**
   * Upload to group using legacy method
   */
  uploadGroupFile(file: globalThis.File, group_id: string): Observable<File> {
    return this.uploadFile(file, group_id);
  }

  /**
   * Delete a file
   */
  deleteFile(fileId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${fileId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Delete failed');
      }),
      catchError(error => {
        console.error('Error deleting file:', error);
        return throwError(() => error);
      })
    );
  }
} 