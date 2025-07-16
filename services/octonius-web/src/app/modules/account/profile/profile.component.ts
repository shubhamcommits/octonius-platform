import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
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
  
  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<{ field: string; value: any }>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private toastService: ToastService
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
      bio: ['', [Validators.maxLength(500)]],
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
      this.profileForm.patchValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        department: user.department || '',
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        website: (user as any).website || '',
        linkedin: (user as any).linkedin || '',
        twitter: (user as any).twitter || ''
      }, { emitEvent: false }); // Don't trigger save on initial load
      this.avatarPreview = user.avatar_url || null;
    } catch (error) {
      console.error('Error populating form:', error);
      this.toastService.error('Error loading profile data');
    }
  }

  private saveField(field: string, value: any): void {
    if (!this.user || this.isSaving) return;

    // Check if the value actually changed
    const currentValue = (this.user as any)[field];
    if (currentValue === value) return;

    this.isSaving = true;
    const updates: Partial<User> = { [field]: value };

    this.userService.updateUser(this.user.uuid, updates).subscribe({
      next: (user) => {
        this.user = user;
        this.authService.setCurrentUser(user);
        this.isSaving = false;
        // Show subtle feedback
        this.showSaveIndicator(field);
      },
      error: (err) => {
        this.toastService.error(`Failed to update ${field}`);
        this.isSaving = false;
        // Revert the field value
        if (this.profileForm && this.user) {
          this.profileForm.get(field)?.setValue((this.user as any)[field], { emitEvent: false });
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
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
        // TODO: Upload avatar and save
        this.uploadAvatar(file);
      };
      reader.readAsDataURL(file);
    }
  }

  private uploadAvatar(file: File): void {
    // TODO: Implement avatar upload
    this.toastService.info('Avatar upload feature coming soon!');
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
} 