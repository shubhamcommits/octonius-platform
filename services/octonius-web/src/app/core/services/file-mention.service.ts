import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, map, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileService } from './file.service';
import { File } from '../models/file.model';

export interface MentionFile {
  id: string;
  name: string;
  title?: string;
  type: string;
  size: number;
  url?: string;
  download_url?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
}

export interface FileMentionSuggestion {
  id: string;
  label: string;
  type: string;
  size?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileMentionService {
  private apiUrl = `${environment.apiUrl}/files`;
  private currentGroupId: string | null = null;
  private currentWorkplaceId: string | null = null;
  private currentUserId: string | null = null;

  constructor(
    private http: HttpClient,
    private fileService: FileService
  ) {}

  setContext(groupId?: string, workplaceId?: string, userId?: string): void {
    console.log('🔍 FileMentionService: Setting context:', { groupId, workplaceId, userId });
    this.currentGroupId = groupId || null;
    this.currentWorkplaceId = workplaceId || null;
    this.currentUserId = userId || null;
    console.log('🔍 FileMentionService: Context set to:', { 
      currentGroupId: this.currentGroupId, 
      currentWorkplaceId: this.currentWorkplaceId,
      currentUserId: this.currentUserId
    });
  }

  private getDefaultFiles(): Observable<MentionFile[]> {
    const params = new HttpParams()
      .set('limit', '10');

    // If we have a "myspace" context, use FileService.getMySpaceFiles
    if (this.currentGroupId === 'myspace') {
      console.log('🔍 FileMentionService: Using myspace context for default files');
      return this.fileService.getMySpaceFiles('')
        .pipe(
          map((files: File[]) => {
            console.log('🔍 Default my-space files from FileService:', files);
            return files.map((file: File) => ({
              id: file.id,
              name: file.name,
              title: file.title || file.name,
              type: file.type,
              size: file.size || 0,
              url: file.cdn_url,
              download_url: file.cdn_url,
              owner: file.owner,
              created_at: file.last_modified,
              updated_at: file.last_modified
            }));
          }),
          catchError(error => {
            console.error('🔍 Error fetching default my-space files:', error);
            return of([]);
          })
        );
    }

    // If we have a group context, get group files using the correct API
    if (this.currentGroupId && this.currentUserId) {
      const groupParams = new HttpParams()
        .set('user_id', this.currentUserId)
        .set('workplace_id', this.currentWorkplaceId || '')
        .set('group_id', this.currentGroupId)
        .set('limit', '10');

      return this.http.get<any>(`${environment.apiUrl}/files`, { params: groupParams })
        .pipe(
          map(response => {
            console.log('🔍 Group files response:', response);
            if (response.success && response.files) {
              return response.files.map((file: any) => ({
                id: file.uuid,
                label: file.name,
                icon: this.getFileIcon(file.type, file.name),
                type: file.type,
                size: file.size
              }));
            }
            return [];
          }),
          catchError(error => {
            console.error('🔍 Error fetching group files:', error);
            return of([]);
          })
        );
    }

    // If we have a workplace context, get workplace files
    if (this.currentWorkplaceId && this.currentUserId) {
      const workplaceParams = new HttpParams()
        .set('user_id', this.currentUserId)
        .set('workplace_id', this.currentWorkplaceId)
        .set('limit', '10');

      return this.http.get<any>(`${environment.apiUrl}/files`, { params: workplaceParams })
        .pipe(
          map(response => {
            console.log('🔍 Workplace files response:', response);
            if (response.success && response.files) {
              return response.files.map((file: any) => ({
                id: file.uuid,
                label: file.name,
                icon: this.getFileIcon(file.type, file.name),
                type: file.type,
                size: file.size
              }));
            }
            return [];
          }),
          catchError(error => {
            console.error('🔍 Error fetching workplace files:', error);
            return of([]);
          })
        );
    }

    // Fallback to my-space files
    return this.http.get<any>(`${environment.apiUrl}/files/myspace`, { params })
      .pipe(
        map(response => {
          console.log('🔍 My-space files response:', response);
          if (response.success && response.files) {
            return response.files.map((file: any) => ({
              id: file.uuid,
              label: file.name,
              icon: this.getFileIcon(file.type),
              type: file.type,
              size: file.size
            }));
          }
          return [];
        }),
        catchError(error => {
          console.error('🔍 Error fetching my-space files:', error);
          return of([]);
        })
      );
  }

  searchFiles(query: string): Observable<MentionFile[]> {
    if (!query.trim()) {
      // Return some default files when query is empty
      return this.getDefaultFiles();
    }

    // If we have a "myspace" context, use FileService.getMySpaceFiles
    if (this.currentGroupId === 'myspace') {
      console.log('🔍 FileMentionService: Using myspace context with FileService.getMySpaceFiles');
      return this.fileService.getMySpaceFiles(query.trim())
        .pipe(
          map((files: File[]) => {
            console.log('🔍 My-space files from FileService (raw):', files);
            console.log('🔍 Number of files returned:', files.length);
            
            const mappedFiles = files.map((file: File) => {
              const mapped = {
                id: file.id,
                name: file.name,
                title: file.title || file.name,
                type: file.type,
                size: file.size || 0,
                url: file.cdn_url,
                download_url: file.cdn_url,
                owner: file.owner,
                created_at: file.last_modified,
                updated_at: file.last_modified
              };
              console.log('🔍 Mapped file:', mapped);
              return mapped;
            });
            
            console.log('🔍 All mapped files:', mappedFiles);
            return mappedFiles;
          }),
          catchError(error => {
            console.error('🔍 Error searching my-space files via FileService:', error);
            return of([]);
          })
        );
    }

    // If we have a group context, search files within that group using the correct API
    if (this.currentGroupId && this.currentUserId) {
      const groupParams = new HttpParams()
        .set('user_id', this.currentUserId)
        .set('workplace_id', this.currentWorkplaceId || '')
        .set('group_id', this.currentGroupId)
        .set('search', query.trim())
        .set('limit', '10');

      return this.http.get<any>(`${environment.apiUrl}/files`, { params: groupParams })
        .pipe(
          map(response => {
            console.log('🔍 Group files search response:', response);
            if (response.success && response.files) {
              return response.files.map((file: any) => ({
                id: file.uuid,
                name: file.name,
                title: file.name,
                type: file.type,
                size: file.size
              }));
            }
            return [];
          }),
          catchError(error => {
            console.error('🔍 Error searching group files:', error);
            return of([]);
          })
        );
    }

    // If we have a workplace context, search files within that workplace
    if (this.currentWorkplaceId && this.currentUserId) {
      const workplaceParams = new HttpParams()
        .set('user_id', this.currentUserId)
        .set('workplace_id', this.currentWorkplaceId)
        .set('search', query.trim())
        .set('limit', '10');

      return this.http.get<any>(`${environment.apiUrl}/files`, { params: workplaceParams })
        .pipe(
          map(response => {
            console.log('🔍 Workplace files search response:', response);
            if (response.success && response.files) {
              return response.files.map((file: any) => ({
                id: file.uuid,
                name: file.name,
                title: file.name,
                type: file.type,
                size: file.size
              }));
            }
            return [];
          }),
          catchError(error => {
            console.error('🔍 Error searching workplace files:', error);
            return of([]);
          })
        );
    }

    // Fallback to general file search
    console.log('🔍 FileMentionService: Using general file search as fallback');
    const fallbackParams = new HttpParams()
      .set('search', query.trim())
      .set('limit', '10');
    return this.http.get<any>(`${this.apiUrl}`, { params: fallbackParams })
      .pipe(
        map(response => {
          console.log('🔍 General files response:', response);
          if (response.success && response.data) {
            return response.data.map((file: any) => ({
              id: file.id || file.uuid,
              name: file.name,
              title: file.title || file.name,
              type: file.type,
              size: file.size || 0,
              url: file.cdn_url,
              download_url: file.download_url,
              owner: file.owner,
              created_at: file.created_at || file.last_modified,
              updated_at: file.updated_at || file.last_modified
            }));
          }
          return [];
        }),
        catchError(error => {
          console.error('🔍 Error searching general files:', error);
          return of([]);
        })
      );
  }

  getFileSuggestions(query: string): Observable<FileMentionSuggestion[]> {
    return this.searchFiles(query).pipe(
      map(files => {
        console.log('🔍 FileMentionService: Raw files from searchFiles:', files);
        const suggestions = files.map(file => {
          const suggestion = {
            id: file.id,
            label: file.title || file.name,
            type: file.type,
            size: this.formatFileSize(file.size),
            icon: this.getFileIcon(file.type)
          };
          console.log('🔍 FileMentionService: Mapped suggestion:', suggestion);
          return suggestion;
        });
        console.log('🔍 FileMentionService: Final suggestions:', suggestions);
        return suggestions;
      })
    );
  }

  getFileById(id: string): Observable<MentionFile | null> {
    return this.http.get<{data: MentionFile}>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data || null)
      );
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getFileTypeFromName(fileName: string): string {
    if (!fileName) return 'default';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'default';
    
    return extension;
  }

  private getFileIcon(type: string, fileName?: string): string {
    // First try to get icon based on file extension if fileName is provided
    if (fileName) {
      const fileExtension = this.getFileTypeFromName(fileName);
      const iconFromExtension = this.getIconByExtension(fileExtension);
      if (iconFromExtension !== 'file') {
        return iconFromExtension;
      }
    }
    
    // Fallback to type-based mapping
    const iconMap: { [key: string]: string } = {
      'note': 'file-pen-line',
      'pdf': 'file-text',
      'doc': 'file-text',
      'docx': 'file-text',
      'xls': 'file-keynote',
      'xlsx': 'file-keynote',
      'ppt': 'file-keynote',
      'pptx': 'file-keynote',
      'image': 'file-image',
      'video': 'file-video',
      'audio': 'file-audio',
      'folder': 'folder',
      'zip': 'file-archive',
      'rar': 'file-archive',
      '7z': 'file-archive',
      'tar': 'file-archive',
      'gz': 'file-archive',
      'default': 'file'
    };
    
    return iconMap[type] || iconMap['default'];
  }

  private getIconByExtension(extension: string): string {
    const iconMap: { [key: string]: string } = {
      'jpg': 'file-image',
      'jpeg': 'file-image',
      'png': 'file-image',
      'gif': 'file-image',
      'svg': 'file-image',
      'webp': 'file-image',
      'bmp': 'file-image',
      'tiff': 'file-image',
      'mp4': 'file-video',
      'avi': 'file-video',
      'mov': 'file-video',
      'wmv': 'file-video',
      'flv': 'file-video',
      'webm': 'file-video',
      'mp3': 'file-audio',
      'wav': 'file-audio',
      'flac': 'file-audio',
      'aac': 'file-audio',
      'ogg': 'file-audio',
      'pdf': 'file-text',
      'doc': 'file-text',
      'docx': 'file-text',
      'txt': 'file-text',
      'md': 'file-text',
      'rtf': 'file-text',
      'xls': 'file-keynote',
      'xlsx': 'file-keynote',
      'ppt': 'file-keynote',
      'pptx': 'file-keynote',
      'zip': 'file-archive',
      'rar': 'file-archive',
      '7z': 'file-archive',
      'tar': 'file-archive',
      'gz': 'file-archive',
      'json': 'file-code',
      'js': 'file-code',
      'ts': 'file-code',
      'html': 'file-code',
      'css': 'file-code',
      'py': 'file-code',
      'java': 'file-code',
      'cpp': 'file-code',
      'c': 'file-code',
      'php': 'file-code',
      'rb': 'file-code',
      'go': 'file-code',
      'rs': 'file-code',
      'default': 'file'
    };
    
    return iconMap[extension] || iconMap['default'];
  }
}
