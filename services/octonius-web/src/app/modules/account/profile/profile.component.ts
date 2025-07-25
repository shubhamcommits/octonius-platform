import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileService } from '../../../core/services/file.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  profileForm: FormGroup | null = null;
  isLoading = false;
  isSaving = false;
  avatarPreview: string | null = null;
  error: string | null = null;
  
  // Image upload state
  imagePreviewUrl: SafeUrl | null = null;
  uploadProgress: number | null = null;
  uploading: boolean = false;
  uploadError: string | null = null;
  
  // Location picker state
  showLocationPicker = false;
  currentLocationCoords: { lat: number; lng: number } | undefined = undefined;
  pendingLocation: any = null;
  
  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<{ field: string; value: any }>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private fileService: FileService,
    private onboardingService: OnboardingService,
    private sanitizer: DomSanitizer
  ) {
    this.initializeForm();
    this.setupAutoSave();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      phone: [''],
      job_title: [''],
      department: [''],
      timezone: ['UTC'],
      language: ['en'],
      bio: ['', [Validators.maxLength(5000)]],
      location: [''],
      website: ['', [Validators.pattern('https?://.+')]],
      linkedin: [''],
      twitter: ['']
    });
  }

  private setupAutoSave(): void {
    // Setup auto-save with debouncing
    this.saveSubject$
      .pipe(
        debounceTime(1000), // Wait 1 second after user stops typing
        distinctUntilChanged((prev, curr) => prev.field === curr.field && prev.value === curr.value),
        takeUntil(this.destroy$)
      )
      .subscribe(({ field, value }) => {
        this.saveField(field, value);
      });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormListeners(): void {
    if (!this.profileForm) return;

    // Listen to form value changes
    Object.keys(this.profileForm.controls).forEach(key => {
      if (key !== 'email') { // Skip email as it's disabled
        this.profileForm?.get(key)?.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(value => {
            if (this.profileForm?.get(key)?.valid) {
              this.saveSubject$.next({ field: key, value });
            }
          });
      }
    });
  }

  loadUserData(): void {
    this.isLoading = true;
    this.error = null;
    
    // Ensure form is initialized
    if (!this.profileForm) {
      this.initializeForm();
    }
    
    this.userService.getCurrentUser().subscribe({
      next: (user_data: User) => {
        if (user_data) {
          this.user = user_data;
          this.populateForm(this.user);
        } else {
          this.handleNoUser();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
        // Fallback to local user data
        const localUser = this.authService.getCurrentUser();
        if (localUser) {
          this.user = localUser;
          this.populateForm(this.user);
        } else {
          this.handleNoUser();
        }
        this.isLoading = false;
        if (this.error) {
          this.toastService.error(this.error);
        }
      }
    });
  }

  handleNoUser() {
    this.user = null;
    this.error = 'User data could not be loaded. Please try again or contact support.';
    this.toastService.error(this.error);
  }

  populateForm(user: User | null): void {
    if (!user || !this.profileForm) return;
    
    try {
      // Get metadata values with safe access
      const metadata = (user as any).metadata || {};
      
      this.profileForm.patchValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        department: user.department || '',
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        bio: metadata.bio || '',
        location: metadata.location || '',
        website: metadata.website || '',
        linkedin: metadata.linkedin || '',
        twitter: metadata.twitter || ''
      }, { emitEvent: false }); // Don't trigger save on initial load
      this.avatarPreview = user.avatar_url || null;
    } catch (error) {
      console.error('Error populating form:', error);
      this.toastService.error('Error loading profile data');
    }
  }

  private saveField(field: string, value: any): void {
    if (!this.user || this.isSaving) return;

    // List of fields that belong in metadata
    const metadataFields = ['bio', 'location', 'website', 'linkedin', 'twitter'];
    const isMetadataField = metadataFields.includes(field);

    // Check if the value actually changed
    const currentUser = this.user as any;
    const currentValue = isMetadataField 
      ? currentUser.metadata?.[field] 
      : currentUser[field];
    
    if (currentValue === value) return;

    this.isSaving = true;
    let updates: Partial<User>;

    if (isMetadataField) {
      // For metadata fields, we need to update the entire metadata object
      const currentMetadata = currentUser.metadata || {};
      updates = {
        metadata: {
          ...currentMetadata,
          [field]: value
        }
      };
    } else {
      // For regular fields, update directly
      updates = { [field]: value };
    }

    this.userService.updateUser(this.user.uuid, updates).subscribe({
      next: (user) => {
        this.user = user;
        this.authService.setCurrentUser(user);
        this.isSaving = false;
        // Show subtle feedback
        this.showSaveIndicator(field);
        
        // Check if we should reset onboarding flag (when name fields are saved)
        if (field === 'first_name' || field === 'last_name') {
          const hasFirstName = user.first_name && user.first_name.trim() !== '';
          const hasLastName = user.last_name && user.last_name.trim() !== '';
          if (hasFirstName && hasLastName) {
            this.onboardingService.resetOnboardingFlag();
          }
        }
      },
      error: (err) => {
        this.toastService.error(`Failed to update ${field}`);
        this.isSaving = false;
        // Revert the field value
        if (this.profileForm && this.user) {
          const revertValue = isMetadataField
            ? (this.user as any).metadata?.[field]
            : (this.user as any)[field];
          this.profileForm.get(field)?.setValue(revertValue || '', { emitEvent: false });
        }
      }
    });
  }

  private showSaveIndicator(field: string): void {
    // Add a visual indicator that the field was saved
    const control = document.querySelector(`[formControlName="${field}"]`);
    if (control) {
      control.classList.add('saved');
      setTimeout(() => {
        control.classList.remove('saved');
      }, 2000);
    }
    
    // For tiptap editor, also add the class to the parent app-tiptap-editor element
    if (field === 'bio') {
      const tiptapEditor = document.querySelector('app-tiptap-editor[formControlName="bio"]');
      if (tiptapEditor) {
        tiptapEditor.classList.add('saved');
        setTimeout(() => {
          tiptapEditor.classList.remove('saved');
        }, 2000);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('Image size should be less than 5MB');
      return;
    }

    this.uploadError = null;
    this.uploading = true;
    this.uploadProgress = 0;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      this.avatarPreview = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to S3
    this.uploadAvatar(file);
  }

  private uploadAvatar(file: File): void {
    if (!this.user) return;

    this.fileService.uploadFileViaS3(file, undefined, 'user').subscribe({
      next: (uploadedFile: any) => {
        const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url;
        this.avatarPreview = url;
        this.uploading = false;
        this.uploadProgress = null;
        
        // Update user avatar
        this.saveField('avatar_url', url);
      },
      error: (err: any) => {
        this.uploadError = 'Failed to upload avatar. Please try again.';
        this.uploading = false;
        this.uploadProgress = null;
        this.toastService.error(this.uploadError);
        
        // Reset the file input
        const input = document.getElementById('avatar-upload') as HTMLInputElement;
        if (input) {
          input.value = '';
        }
      }
    });
  }

  clearAvatarUpload(): void {
    this.imagePreviewUrl = null;
    this.avatarPreview = null;
    this.uploadError = null;
    
    // Clear the file input
    const input = document.getElementById('avatar-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    
    // Update user avatar to null
    if (this.user) {
      this.saveField('avatar_url', null);
    }
  }

  get fullName(): string {
    if (!this.user) return '';
    const firstName = this.user.first_name || '';
    const lastName = this.user.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  get initials(): string {
    if (!this.user) return '';
    const firstName = this.user.first_name || '';
    const lastName = this.user.last_name || '';
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  get bioCharacterCount(): number {
    const bioValue = this.profileForm?.get('bio')?.value || '';
    // Strip HTML tags to count actual text characters
    return bioValue.replace(/<[^>]*>/g, '').length;
  }

  getDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  updateNotificationPreference(type: 'email' | 'push' | 'in_app', checked: boolean): void {
    if (!this.user) return;
    
    if (!this.user.notification_preferences) {
      this.user.notification_preferences = {
        email: true,
        push: true,
        in_app: true
      };
    }
    
    this.user.notification_preferences[type] = checked;
    this.saveField('notification_preferences', this.user.notification_preferences);
  }

  copyUuid(uuid: string | undefined) {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    this.toastService.success('User ID copied to clipboard!');
  }
  
  openLocationPicker(): void {
    // Try to get location coordinates from user metadata first
    const metadata = (this.user as any)?.metadata || {};
    
    if (metadata.location_coordinates) {
      // Use stored coordinates from metadata
      this.currentLocationCoords = {
        lat: metadata.location_coordinates.lat,
        lng: metadata.location_coordinates.lng
      };
    } else {
      // Fallback: try to parse from location string
      const currentLocation = this.profileForm?.get('location')?.value || metadata.location;
      
      if (typeof currentLocation === 'string' && currentLocation.includes(',')) {
        // Try to parse lat,lng format
        const parts = currentLocation.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          this.currentLocationCoords = { lat: parts[0], lng: parts[1] };
        }
      } else {
        // No valid location found, use undefined to trigger default
        this.currentLocationCoords = undefined;
      }
    }
    
    this.pendingLocation = null; // Clear any previous pending location
    this.showLocationPicker = true;
  }
  
  onLocationSelected(location: any): void {
    if (location) {
      // Store the pending location without closing the modal
      this.pendingLocation = location;
    }
  }
  
  confirmLocationSelection(): void {
    if (this.pendingLocation) {
      // Store the location as a formatted string with coordinates
      const locationString = this.pendingLocation.address || `${this.pendingLocation.lat.toFixed(6)}, ${this.pendingLocation.lng.toFixed(6)}`;
      
      // Update form value
      this.profileForm?.get('location')?.setValue(locationString);
      
      // Store coordinates in metadata
      const metadata = (this.user as any)?.metadata || {};
      const updatedMetadata = {
        ...metadata,
        location: locationString,
        location_coordinates: {
          lat: this.pendingLocation.lat,
          lng: this.pendingLocation.lng
        }
      };
      
      // Save metadata
      this.saveField('metadata', updatedMetadata);
      
      // Clear pending location and close modal
      this.pendingLocation = null;
      this.showLocationPicker = false;
    }
  }
} 