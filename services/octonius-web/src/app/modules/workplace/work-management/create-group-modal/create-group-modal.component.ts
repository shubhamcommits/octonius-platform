import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FileService } from '../../../../core/services/file.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface CreateGroupData {
  name: string;
  description?: string;
  imageUrl?: string;
  settings?: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    visibility: 'public' | 'private';
    defaultRole: 'member' | 'admin';
  };
  metadata?: {
    tags: string[];
    category?: string;
    department?: string;
  };
}

@Component({
  selector: 'app-create-group-modal',
  standalone: false,
  templateUrl: './create-group-modal.component.html',
  styleUrls: ['./create-group-modal.component.scss']
})
export class CreateGroupModalComponent implements OnInit {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() groupCreated = new EventEmitter<CreateGroupData>();

  form;
  tags: string[] = [];
  imagePreviewUrl: SafeUrl | null = null;
  uploadProgress: number | null = null;
  uploading: boolean = false;
  uploadError: string | null = null;
  imageUrlLocked: boolean = false;

  constructor(private fb: FormBuilder, private fileService: FileService, private sanitizer: DomSanitizer) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      imageUrl: [''],
      visibility: ['public', Validators.required],
      allowMemberInvites: [true],
      requireApproval: [false],
      defaultRole: ['member', Validators.required],
      category: [''],
      department: [''],
      tagInput: ['']
    });
  }

  ngOnInit(): void {
    console.log('CreateGroupModalComponent initialized');
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      
      const groupData: CreateGroupData = {
        name: (formValue.name || '').trim(),
        description: formValue.description?.trim() || undefined,
        imageUrl: formValue.imageUrl?.trim() || undefined,
        settings: {
          allowMemberInvites: Boolean(formValue.allowMemberInvites),
          requireApproval: Boolean(formValue.requireApproval),
          visibility: (formValue.visibility || 'public') as 'public' | 'private',
          defaultRole: (formValue.defaultRole || 'member') as 'member' | 'admin'
        },
        metadata: {
          tags: this.tags,
          category: formValue.category?.trim() || undefined,
          department: formValue.department?.trim() || undefined
        }
      };

      this.groupCreated.emit(groupData);
    }
  }

  onClose() {
    this.close.emit();
  }

  addTag() {
    const tagInput = this.form.get('tagInput');
    const tag = tagInput?.value?.trim();
    
    if (tag && tag.length > 0 && !this.tags.includes(tag) && this.tags.length < 10) {
      this.tags.push(tag);
      tagInput?.setValue('');
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagInputKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

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
    // Upload to S3 (no group_id yet, so just use uploadFileViaS3)
    this.fileService.uploadFileViaS3(file).subscribe({
      next: (uploadedFile: any) => {
        const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url;
        this.form.get('imageUrl')?.setValue(url);
        this.uploading = false;
        this.uploadProgress = null;
        this.imageUrlLocked = true;
        this.form.get('imageUrl')?.disable();
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
    this.form.get('imageUrl')?.setValue('');
    this.form.get('imageUrl')?.enable();
  }
} 