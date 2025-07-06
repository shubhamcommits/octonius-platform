# Angular S3 Upload Service Usage Guide

This guide shows how to use the updated Angular FileService with S3 upload capabilities and snake_case API responses.

## Updated File Model

The File model now uses snake_case fields to match the API:

```typescript
interface File {
  id: string;
  name: string;
  type: 'note' | 'file';
  icon: string;
  owner: string;
  owner_avatar: string;     // Changed from ownerAvatar
  last_modified: string;    // Changed from lastModified
  size?: number;
  mime_type?: string;       // Changed from mimeType
  title?: string;
  content?: any;
  cdn_url?: string;         // New: CDN URL for public access
}
```

## Service Methods

### S3 Upload Methods (Recommended)

```typescript
// Complete S3 upload process (one method does it all)
uploadFileViaS3(file: File, group_id?: string): Observable<File>

// Individual S3 steps (for custom upload flows)
createUploadIntent(request: UploadIntentRequest): Observable<UploadIntentResponse>
uploadToS3(uploadUrl: string, file: File): Observable<void>
completeFileUpload(request: CompleteUploadRequest): Observable<File>

// Download methods
getFileDownloadUrl(fileId: string): Observable<FileDownloadUrlResponse>
downloadFileSecure(fileId: string): Observable<{blob: Blob, fileName: string, cdnUrl?: string}>
getCdnUrl(fileId: string): Observable<string | null>
```

### Utility Methods

```typescript
// S3 uploads (recommended)
uploadMySpaceFileS3(file: File): Observable<File>
uploadGroupFileS3(file: File, group_id: string): Observable<File>

// Legacy uploads (backward compatibility)
uploadMySpaceFile(file: File): Observable<File>
uploadGroupFile(file: File, group_id: string): Observable<File>
```

## Component Examples

### Basic File Upload Component

```typescript
import { Component } from '@angular/core';
import { FileService } from '../core/services/file.service';
import { File } from '../core/models/file.model';

@Component({
  selector: 'app-file-upload',
  template: `
    <div class="upload-container">
      <input type="file" 
             #fileInput 
             (change)="onFileSelected($event)"
             [disabled]="uploading">
      
      <div *ngIf="uploading" class="upload-progress">
        <div class="spinner"></div>
        <span>Uploading to S3...</span>
      </div>
      
      <div *ngIf="uploadedFile" class="upload-success">
        <p>✅ File uploaded successfully!</p>
        <p><strong>Name:</strong> {{ uploadedFile.name }}</p>
        <p><strong>Size:</strong> {{ formatFileSize(uploadedFile.size) }}</p>
        <p><strong>CDN URL:</strong> {{ uploadedFile.cdn_url }}</p>
      </div>
      
      <div *ngIf="error" class="upload-error">
        <p>❌ Upload failed: {{ error }}</p>
      </div>
    </div>
  `
})
export class FileUploadComponent {
  uploading = false;
  uploadedFile: File | null = null;
  error: string | null = null;

  constructor(private fileService: FileService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadFileS3(input.files[0]);
    }
  }

  private uploadFileS3(file: globalThis.File): void {
    this.uploading = true;
    this.error = null;
    this.uploadedFile = null;

    // Upload to MySpace using S3
    this.fileService.uploadMySpaceFileS3(file).subscribe({
      next: (uploadedFile) => {
        this.uploadedFile = uploadedFile;
        this.uploading = false;
        console.log('File uploaded successfully:', uploadedFile);
      },
      error: (error) => {
        this.error = error.message || 'Upload failed';
        this.uploading = false;
        console.error('Upload error:', error);
      }
    });
  }

  private formatFileSize(bytes?: number): string {
    if (!bytes) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
```

### Group File Upload Component

```typescript
import { Component, Input } from '@angular/core';
import { FileService } from '../core/services/file.service';

@Component({
  selector: 'app-group-file-upload',
  template: `
    <div class="group-upload">
      <h3>Upload to {{ groupName }}</h3>
      
      <div class="upload-area" 
           (drop)="onDrop($event)" 
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           [class.drag-over]="isDragOver">
        
        <div *ngIf="!uploading" class="upload-prompt">
          <p>Drop files here or <button type="button" (click)="fileInput.click()">browse</button></p>
          <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)">
        </div>
        
        <div *ngIf="uploading" class="upload-progress">
          <p>Uploading {{ uploadQueue.length }} files...</p>
          <div class="progress-list">
            <div *ngFor="let item of uploadQueue" class="progress-item">
              <span>{{ item.file.name }}</span>
              <span [ngSwitch]="item.status">
                <span *ngSwitchCase="'uploading'">⏳ Uploading...</span>
                <span *ngSwitchCase="'completed'">✅ Complete</span>
                <span *ngSwitchCase="'error'">❌ Failed</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GroupFileUploadComponent {
  @Input() groupId!: string;
  @Input() groupName!: string;

  uploading = false;
  isDragOver = false;
  uploadQueue: Array<{file: globalThis.File, status: 'pending' | 'uploading' | 'completed' | 'error'}> = [];

  constructor(private fileService: FileService) {}

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length) {
      this.uploadMultipleFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);
      this.uploadMultipleFiles(files);
    }
  }

  private uploadMultipleFiles(files: globalThis.File[]): void {
    this.uploading = true;
    this.uploadQueue = files.map(file => ({ file, status: 'pending' }));

    // Upload files sequentially to avoid overwhelming the server
    this.uploadNextFile(0);
  }

  private uploadNextFile(index: number): void {
    if (index >= this.uploadQueue.length) {
      this.uploading = false;
      return;
    }

    const item = this.uploadQueue[index];
    item.status = 'uploading';

    this.fileService.uploadGroupFileS3(item.file, this.groupId).subscribe({
      next: (result) => {
        item.status = 'completed';
        console.log(`File ${item.file.name} uploaded successfully:`, result);
        this.uploadNextFile(index + 1);
      },
      error: (error) => {
        item.status = 'error';
        console.error(`Error uploading ${item.file.name}:`, error);
        this.uploadNextFile(index + 1);
      }
    });
  }
}
```

### File Display Component

```typescript
import { Component, Input } from '@angular/core';
import { FileService } from '../core/services/file.service';
import { File } from '../core/models/file.model';

@Component({
  selector: 'app-file-display',
  template: `
    <div class="file-item" [class.file-type]="file.type">
      <div class="file-icon">{{ file.icon }}</div>
      
      <div class="file-info">
        <h4>{{ file.name }}</h4>
        <p class="file-meta">
          {{ file.owner }} • {{ formatDate(file.last_modified) }}
          <span *ngIf="file.size"> • {{ formatFileSize(file.size) }}</span>
        </p>
      </div>
      
      <div class="file-actions">
        <!-- For images, show CDN URL for instant preview -->
        <button *ngIf="isImage(file.mime_type)" 
                (click)="openImage()"
                class="action-btn preview">
          🖼️ Preview
        </button>
        
        <!-- For all files, secure download -->
        <button (click)="downloadFile()" 
                [disabled]="downloading"
                class="action-btn download">
          {{ downloading ? '⏳' : '📥' }} Download
        </button>
        
        <!-- Share CDN URL for public files -->
        <button *ngIf="file.cdn_url" 
                (click)="copyShareLink()"
                class="action-btn share">
          🔗 Share
        </button>
      </div>
    </div>
  `
})
export class FileDisplayComponent {
  @Input() file!: File;
  
  downloading = false;

  constructor(private fileService: FileService) {}

  isImage(mimeType?: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  openImage(): void {
    if (this.file.cdn_url) {
      // Use CDN URL for instant image preview
      window.open(this.file.cdn_url, '_blank');
    } else {
      // Fallback to secure download URL
      this.downloadFile();
    }
  }

  downloadFile(): void {
    this.downloading = true;
    
    this.fileService.downloadFileSecure(this.file.id).subscribe({
      next: (result) => {
        // Create download link
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName;
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (error) => {
        console.error('Download failed:', error);
        this.downloading = false;
        // Show error message to user
      }
    });
  }

  copyShareLink(): void {
    if (this.file.cdn_url) {
      navigator.clipboard.writeText(this.file.cdn_url).then(() => {
        // Show success message
        console.log('Share link copied to clipboard');
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
```

### Custom Upload Flow Component

```typescript
import { Component } from '@angular/core';
import { FileService } from '../core/services/file.service';
import { UploadIntentRequest } from '../core/models/file.model';

@Component({
  selector: 'app-custom-upload',
  template: `
    <div class="custom-upload">
      <h3>Custom Upload Flow</h3>
      
      <input type="file" #fileInput (change)="onFileSelected($event)">
      
      <div *ngIf="uploadSteps.length" class="upload-steps">
        <div *ngFor="let step of uploadSteps" 
             class="step" 
             [class.active]="step.active"
             [class.completed]="step.completed"
             [class.error]="step.error">
          <span class="step-number">{{ step.number }}</span>
          <span class="step-name">{{ step.name }}</span>
          <span class="step-status">{{ step.status }}</span>
        </div>
      </div>
      
      <div *ngIf="result" class="result">
        <h4>Upload Result:</h4>
        <pre>{{ result | json }}</pre>
      </div>
    </div>
  `
})
export class CustomUploadComponent {
  uploadSteps: Array<{
    number: number;
    name: string;
    status: string;
    active: boolean;
    completed: boolean;
    error: boolean;
  }> = [];
  
  result: any = null;

  constructor(private fileService: FileService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.customUploadFlow(input.files[0]);
    }
  }

  private customUploadFlow(file: globalThis.File): void {
    this.initializeSteps();
    this.result = null;

    // Step 1: Create upload intent
    this.updateStep(1, 'Creating upload intent...', true);
    
    const request: UploadIntentRequest = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size
    };

    this.fileService.createUploadIntent(request).subscribe({
      next: (intentResponse) => {
        this.updateStep(1, 'Upload intent created ✅', false, true);
        console.log('Upload intent:', intentResponse);
        
        // Step 2: Upload to S3
        this.updateStep(2, 'Uploading to S3...', true);
        
        this.fileService.uploadToS3(intentResponse.data.upload_url, file).subscribe({
          next: () => {
            this.updateStep(2, 'S3 upload completed ✅', false, true);
            
            // Step 3: Complete upload
            this.updateStep(3, 'Saving file metadata...', true);
            
            const completeRequest = {
              file_key: intentResponse.data.file_key,
              file_name: intentResponse.data.metadata.file_name,
              file_type: intentResponse.data.metadata.file_type,
              file_size: intentResponse.data.metadata.file_size,
              group_id: intentResponse.data.metadata.resolved_group_id
            };
            
            this.fileService.completeFileUpload(completeRequest).subscribe({
              next: (fileResult) => {
                this.updateStep(3, 'Upload completed ✅', false, true);
                this.result = fileResult;
                console.log('Final result:', fileResult);
              },
              error: (error) => {
                this.updateStep(3, 'Failed to save metadata ❌', false, false, true);
                console.error('Complete upload error:', error);
              }
            });
          },
          error: (error) => {
            this.updateStep(2, 'S3 upload failed ❌', false, false, true);
            console.error('S3 upload error:', error);
          }
        });
      },
      error: (error) => {
        this.updateStep(1, 'Failed to create intent ❌', false, false, true);
        console.error('Upload intent error:', error);
      }
    });
  }

  private initializeSteps(): void {
    this.uploadSteps = [
      { number: 1, name: 'Create Upload Intent', status: 'Pending', active: false, completed: false, error: false },
      { number: 2, name: 'Upload to S3', status: 'Pending', active: false, completed: false, error: false },
      { number: 3, name: 'Save Metadata', status: 'Pending', active: false, completed: false, error: false }
    ];
  }

  private updateStep(stepNumber: number, status: string, active = false, completed = false, error = false): void {
    const step = this.uploadSteps.find(s => s.number === stepNumber);
    if (step) {
      step.status = status;
      step.active = active;
      step.completed = completed;
      step.error = error;
    }
  }
}
```

## Usage Tips

### 1. **Use S3 Methods for New Uploads**
```typescript
// ✅ Recommended - S3 upload
this.fileService.uploadMySpaceFileS3(file)

// ⚠️ Legacy - direct server upload (for backward compatibility)
this.fileService.uploadMySpaceFile(file)
```

### 2. **Handle CDN URLs for Images**
```typescript
// For images, use CDN URL for instant display
if (file.cdn_url && file.mime_type?.startsWith('image/')) {
  return file.cdn_url; // Fast, cached access
} else {
  // For secure access or non-images, use download URL
  return this.fileService.getFileDownloadUrl(file.id);
}
```

### 3. **Error Handling**
```typescript
this.fileService.uploadFileViaS3(file).subscribe({
  next: (result) => {
    // Handle success
  },
  error: (error) => {
    // S3 uploads can fail at different stages:
    // 1. Upload intent creation (API error)
    // 2. S3 upload (network/S3 error)  
    // 3. Upload completion (API error)
    console.error('Upload failed:', error);
    this.showErrorMessage(error.message);
  }
});
```

### 4. **Progress Tracking**
For upload progress, you can use the individual methods:
```typescript
// Create intent
this.fileService.createUploadIntent(request)
  .pipe(
    switchMap(intent => {
      this.showProgress('Uploading to S3...');
      return this.fileService.uploadToS3(intent.data.upload_url, file);
    }),
    switchMap(() => {
      this.showProgress('Saving metadata...');
      return this.fileService.completeFileUpload(completeRequest);
    })
  )
  .subscribe({
    next: (result) => this.showSuccess(result),
    error: (error) => this.showError(error)
  });
```

## Migration Notes

- **Field Names**: All snake_case fields (`owner_avatar`, `last_modified`, `mime_type`, `cdn_url`)
- **New Methods**: Use `*S3()` methods for better performance
- **CDN URLs**: Available in `cdn_url` field for public access
- **Download**: Use `downloadFileSecure()` for authenticated downloads
- **Legacy Support**: Old methods still work for backward compatibility 