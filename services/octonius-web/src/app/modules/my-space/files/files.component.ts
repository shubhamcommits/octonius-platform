import { Component, OnInit, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { UserService } from '../../../core/services/user.service'
import { AuthService, User } from '../../../core/services/auth.service'
import { FileService } from '../../../core/services/file.service'
import { File } from '../../../core/models/file.model'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'
import { firstValueFrom } from 'rxjs'
import { SharedModule } from '../../shared/shared.module'
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CapitalizePipe, SharedModule],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  userName: string = 'User'
  files: File[] = []
  filteredFiles: File[] = []
  isLoading: boolean = true
  error: string | null = null
  user: User | null = null
  searchQuery: string = ''

  constructor(
    private router: Router,
    private authService: AuthService,
    private fileService: FileService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  private async loadData(): Promise<void> {
    try {
      this.isLoading = true
      this.error = null

      // Load user data for display name
      const user_data: User = await firstValueFrom(this.userService.getCurrentUser())
      const user = user_data
      if (!user) {
        throw new Error('No user data available')
      }
      
      this.userName = user.first_name || user.email?.split('@')[0] || 'User'
      this.user = user

      // Load MySpace files (private group files)
      const files = await firstValueFrom(this.fileService.getMySpaceFiles())

      // Files are already transformed by the backend
      this.files = files
      
      this.filteredFiles = [...this.files]
      this.isLoading = false
    } catch (err) {
      this.error = 'Failed to load data. Please try again.'
      this.isLoading = false
      this.toastService.error('Failed to load data. Please try again.')
      console.error('Error loading data:', err)
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: { [key: string]: string } = {
      // Documents
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'txt': 'doc',
      'rtf': 'doc',
      // Spreadsheets
      'xls': 'xls',
      'xlsx': 'xlsx',
      'csv': 'xls',
      'ods': 'xls',
      // Presentations
      'ppt': 'ppt',
      'pptx': 'pptx',
      'odp': 'ppt',
      // Images
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'svg': 'image',
      'webp': 'image',
      'ico': 'image',
      // Videos
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'wmv': 'video',
      'flv': 'video',
      'webm': 'video',
      'mkv': 'video',
      // Audio
      'mp3': 'audio',
      'wav': 'audio',
      'flac': 'audio',
      'aac': 'audio',
      'ogg': 'audio',
      'wma': 'audio',
      'm4a': 'audio',
      // Archives
      'zip': 'zip',
      'rar': 'rar',
      '7z': '7z',
      'tar': 'tar',
      'gz': 'gz',
      'bz2': 'gz',
      'xz': 'gz'
    };
    return typeMap[extension] || 'default';
  }

  hasAvatarImage(file: File): boolean {
    // Check if we have a custom avatar URL
    if (file.owner_avatar && this.isValidUrl(file.owner_avatar)) {
      return true;
    }
    // If no custom avatar but we have a default avatar URL, use it
    if ((!file.owner_avatar || !this.isValidUrl(file.owner_avatar)) && environment.defaultAvatarUrl) {
      return true;
    }
    return false;
  }

  private isValidUrl(url: string | undefined | null): boolean {
    return !!(url && (url.startsWith('http') || url.startsWith('/') || url.includes('.')));
  }

  getAvatarUrl(file: File): string {
    // Return custom avatar if it's a valid URL, otherwise use default
    if (file.owner_avatar && this.isValidUrl(file.owner_avatar)) {
      return file.owner_avatar;
    }
    return environment.defaultAvatarUrl;
  }

  getAvatarInitials(file: File): string {
    // Only show initials if we don't have any image to show
    if (this.hasAvatarImage(file)) {
      return '';
    }
    // If owner_avatar exists but is not a URL (like initials), use it
    if (file.owner_avatar && !this.isValidUrl(file.owner_avatar)) {
      return file.owner_avatar;
    }
    // Otherwise generate initials from owner name
    return this.getInitials(file.owner || 'Unknown User');
  }

  getFileTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'document':
        return 'description';
      case 'image':
        return 'image';
      case 'presentation':
        return 'slideshow';
      case 'spreadsheet':
        return 'table_chart';
      case 'note':
        return 'note';
      default:
        return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFiles = [...this.files]
      return
    }

    const query = this.searchQuery.toLowerCase()
    this.filteredFiles = this.files.filter(file => 
      file.name.toLowerCase().includes(query)
    )
  }

  getFileIcon(type: string): string {
    const icons: { [key: string]: string } = {
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
    }
    return icons[type] || icons['default']
  }

  getDisplayIcon(file: File | null): string {
    // Handle null case
    if (!file) {
      return 'file';
    }
    
    // For notes, use the note icon
    if (file.type === 'note') {
      return 'file-pen-line';
    }
    // For files, determine icon based on file extension
    const fileType = this.getFileTypeFromName(file.name);
    return this.getFileIcon(fileType);
  }

  async onCreateNote(): Promise<void> {
    try {
      const noteName = `Note ${new Date().toLocaleString()}`;
      const noteData = {
        name: noteName,
        title: noteName,
        content: { text: '' }
      };

      this.toastService.info('Creating a new note...');
      const newNote = await firstValueFrom(this.fileService.createMySpaceNote(noteData));
      
      // Add to files list
      this.files = [newNote, ...this.files];
      this.filteredFiles = [...this.files];
      
      this.toastService.success('Note created successfully!');
      
      // Navigate to note editor
              this.router.navigate(['/myspace/note-editor', newNote.id]);
    } catch (error) {
      this.toastService.error('Failed to create note. Please try again.');
      console.error('Error creating note:', error);
    }
  }

  onUploadFile(): void {
    this.toastService.info('Opening file upload dialog...')
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.multiple = true // Allow multiple file selection
    document.body.appendChild(fileInput)

    fileInput.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        for (let i = 0; i < target.files.length; i++) {
          await this.uploadFile(target.files[i])
        }
      }
      document.body.removeChild(fileInput)
    }

    fileInput.click()
  }

  private async uploadFile(file: globalThis.File): Promise<void> {
    try {
      this.toastService.info(`Uploading ${file.name} to S3...`);
      const response = await firstValueFrom(this.fileService.uploadMySpaceFileS3(file))
      this.files = [response, ...this.files]
      this.filteredFiles = [...this.files]
      this.toastService.success(`Successfully uploaded ${file.name} to S3`)
    } catch (err) {
      this.toastService.error(`Failed to upload ${file.name}. Please try again.`)
      console.error('Error uploading file:', err)
    }
  }

  onFileClick(file: File): void {
    if (file.type === 'note') {
      this.router.navigate(['/myspace/note-editor', file.id])
    } else {
      this.downloadFile(file)
    }
  }

  private async downloadFile(file: File): Promise<void> {
    try {
      this.toastService.info(`Downloading ${file.name}...`);
      
      // Always use secure download method for better compatibility
      const result = await firstValueFrom(this.fileService.downloadFileSecure(file.id));
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.toastService.success(`Downloaded ${file.name}`);
    } catch (err: any) {
      let errorMessage = 'Failed to download file. Please try again.';
      
      // Extract more meaningful error message
      if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      this.toastService.error(errorMessage);
      console.error('Error downloading file:', {
        error: err,
        fileName: file.name,
        fileId: file.id,
        fileContent: file.content
      });
    }
  }

  /**
   * Handle preview file action from dropdown menu
   */
  onPreviewFile(file: File): void {
    if (file.type === 'note') {
      // For notes, navigate to editor
      this.router.navigate(['/myspace/note-editor', file.id])
    } else {
      // For files, check if it's previewable
      if (this.isPreviewable(file)) {
        this.previewFile(file)
      } else {
        this.toastService.info('Preview not available for this file type. Use download instead.')
      }
    }
  }

  /**
   * Handle download file action from dropdown menu
   */
  onDownloadFile(file: File): void {
    this.downloadFile(file)
  }

  // Delete confirmation modal state
  showDeleteModal = false;
  fileToDelete: File | null = null;

  /**
   * Handle delete file action from dropdown menu
   */
  onDeleteFile(file: File): void {
    this.fileToDelete = file;
    this.showDeleteModal = true;
  }

  /**
   * Confirm deletion from modal
   */
  confirmDelete(): void {
    if (this.fileToDelete) {
      this.deleteFile(this.fileToDelete);
      this.closeDeleteModal();
    }
  }

  /**
   * Close delete confirmation modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.fileToDelete = null;
  }

  /**
   * Handle keyboard events (Escape key to close modal)
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showDeleteModal) {
      this.closeDeleteModal();
    }
  }

  /**
   * Check if file is previewable (images, PDFs, text files)
   */
  private isPreviewable(file: File): boolean {
    if (!file.mime_type) return false
    
    const previewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/markdown', 'text/csv',
      'application/json'
    ]
    
    return previewableTypes.includes(file.mime_type) || file.mime_type.startsWith('image/')
  }

  /**
   * Preview file in new window/tab using CDN URL
   */
  private previewFile(file: File): void {
    try {
      // Convert S3 URL to CDN URL if needed
      let previewUrl = file.cdn_url;
      
      if (!previewUrl && file.content?.s3Key) {
        // Generate CDN URL from S3 key
        previewUrl = this.convertS3ToCDNUrl(file.content.s3Key);
      }
      
      if (previewUrl) {
        // Use CDN URL for instant preview
        window.open(previewUrl, '_blank');
      } else {
        // Fallback for legacy files without S3/CDN
        this.toastService.info('Generating preview...');
        firstValueFrom(this.fileService.getFileDownloadUrl(file.id)).then(response => {
          if (response.data?.download_url) {
            window.open(response.data.download_url, '_blank');
          } else {
            this.toastService.error('Could not generate preview URL');
          }
        }).catch(error => {
          this.toastService.error('Failed to generate preview');
          console.error('Preview error:', error);
        });
      }
    } catch (error) {
      this.toastService.error('Failed to preview file');
      console.error('Preview error:', error);
    }
  }

  /**
   * Convert S3 URL to CDN URL
   * From: https://s3.eu-central-1.amazonaws.com/media.octonius.com/workplaces/...
   * To: https://media.octonius.com/workplaces/...
   */
  private convertS3ToCDNUrl(s3Key: string): string {
    // If it's already a CDN URL, return as is
    if (s3Key.includes('media.octonius.com') && !s3Key.includes('s3.eu-central-1.amazonaws.com')) {
      return s3Key.startsWith('http') ? s3Key : `https://${s3Key}`;
    }
    
    // Convert S3 key to CDN URL
    const cdnBaseUrl = 'https://media.octonius.com';
    
    // Remove any S3 prefix if present
    let cleanKey = s3Key;
    if (s3Key.includes('s3.eu-central-1.amazonaws.com/media.octonius.com/')) {
      cleanKey = s3Key.split('s3.eu-central-1.amazonaws.com/media.octonius.com/')[1];
    } else if (s3Key.includes('media.octonius.com/')) {
      cleanKey = s3Key.split('media.octonius.com/')[1];
    }
    
    // Ensure the key starts with workplaces or users path
    if (!cleanKey.startsWith('/')) {
      cleanKey = '/' + cleanKey;
    }
    
    return `${cdnBaseUrl}${cleanKey}`;
  }

  /**
   * Delete file
   */
  private async deleteFile(file: File): Promise<void> {
    try {
      this.toastService.info(`Deleting ${file.name}...`)
      
      // Call delete API (you'll need to implement this in FileService)
      await firstValueFrom(this.fileService.deleteFile(file.id))
      
      // Remove file from local arrays
      this.files = this.files.filter(f => f.id !== file.id)
      this.filteredFiles = this.filteredFiles.filter(f => f.id !== file.id)
      
      this.toastService.success(`${file.name} deleted successfully`)
    } catch (error) {
      this.toastService.error('Failed to delete file. Please try again.')
      console.error('Delete error:', error)
    }
  }
} 