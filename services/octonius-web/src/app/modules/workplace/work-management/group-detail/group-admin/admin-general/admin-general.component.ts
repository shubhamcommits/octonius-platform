import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../../services/work-group.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { FileService } from '../../../../../../core/services/file.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-general',
  standalone: false,
  templateUrl: './admin-general.component.html',
  styleUrl: './admin-general.component.scss'
})
export class AdminGeneralComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  isSaving = false;
  
  // Group form data
  groupForm = {
    name: '',
    description: '',
    imageUrl: '',
    metadata: {
      tags: [] as string[],
      category: '',
      department: ''
    }
  };
  
  // Tag management
  newTag = '';
  
  // Image upload
  imagePreviewUrl: SafeUrl | null = null;
  uploadProgress: number | null = null;
  uploading: boolean = false;
  uploadError: string | null = null;
  imageUrlLocked: boolean = false;
  
  private destroy$ = new Subject<void>();
  private originalGroupForm: any = null;

  constructor(
    private workGroupService: WorkGroupService,
    private toastService: ToastService,
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Subscribe to the current group
    this.workGroupService.getCurrentGroup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        this.group = group || undefined;
        if (group) {
          this.loadGroupDetails();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroupDetails(): void {
    if (!this.group) return;
    
    // Populate form with current group data
    this.groupForm = {
      name: this.group.name,
      description: this.group.description || '',
      imageUrl: this.group.imageUrl || '',
      metadata: {
        tags: [...this.group.metadata.tags],
        category: this.group.metadata.category || '',
        department: this.group.metadata.department || ''
      }
    };
    // Deep copy for dirty check
    this.originalGroupForm = JSON.parse(JSON.stringify(this.groupForm));
  }

  saveGeneralSettings(): void {
    if (!this.group) return;
    
    this.isSaving = true;
    this.workGroupService.updateGroup(this.group.uuid, {
      name: this.groupForm.name,
      description: this.groupForm.description,
      imageUrl: this.groupForm.imageUrl,
      metadata: this.groupForm.metadata
    }).subscribe({
      next: (updatedGroup) => {
        this.workGroupService.setCurrentGroup(updatedGroup);
        this.toastService.success('Group settings updated successfully');
        this.isSaving = false;
        // Update original form for dirty check
        this.originalGroupForm = JSON.parse(JSON.stringify(this.groupForm));
      },
      error: (error) => {
        this.toastService.error('Failed to update group settings');
        this.isSaving = false;
      }
    });
  }

  // Tag management
  addTag(): void {
    if (!this.newTag.trim()) return;
    
    if (!this.groupForm.metadata.tags.includes(this.newTag.trim()) && this.groupForm.metadata.tags.length < 10) {
      this.groupForm.metadata.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.groupForm.metadata.tags.splice(index, 1);
  }

  onTagInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  // Image upload
  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadError = null;
    this.uploading = true;
    this.uploadProgress = 0;
    // Show preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    // Upload to S3 for group image
    this.fileService.uploadFileViaS3(file, undefined, 'group').subscribe({
      next: (uploadedFile: any) => {
        const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url;
        this.groupForm.imageUrl = url;
        this.uploading = false;
        this.uploadProgress = null;
        this.imageUrlLocked = true;
      },
      error: (err: any) => {
        this.uploadError = 'Failed to upload image. Please try again.';
        this.uploading = false;
        this.uploadProgress = null;
      }
    });
  }

  clearImageUpload() {
    this.imagePreviewUrl = null;
    this.imageUrlLocked = false;
    this.groupForm.imageUrl = '';
  }

  get isFormDirty(): boolean {
    if (!this.originalGroupForm) return false;
    // Compare all fields (deep)
    return JSON.stringify(this.groupForm) !== JSON.stringify(this.originalGroupForm);
  }
}
