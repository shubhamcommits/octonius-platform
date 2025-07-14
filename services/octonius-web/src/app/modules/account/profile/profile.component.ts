import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  isEditing = false;
  isLoading = false;
  avatarPreview: string | null = null;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
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

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading = true;
    this.error = null;
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
    if (!user) return;
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
    });
    this.avatarPreview = user.avatar_url || null;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form if canceling
      this.populateForm(this.user);
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
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.toastService.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    const formData = this.profileForm.getRawValue();

    if (!this.user) {
      this.toastService.error('User data is missing. Cannot update profile.');
      this.isLoading = false;
      return;
    }

    // Build updates object with only changed fields
    const updates: Partial<User> = {};
    for (const key of Object.keys(formData)) {
      const value = formData[key];
      if (
        value !== (this.user as any)[key] &&
        value !== null &&
        value !== ''
      ) {
        updates[key as keyof User] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      this.toastService.info('No changes to update.');
      this.isLoading = false;
      this.isEditing = false;
      return;
    }

    this.userService.updateUser(this.user.uuid, updates).subscribe({
      next: (user) => {
        this.toastService.success('Profile updated successfully');
        this.isEditing = false;
        this.isLoading = false;
        this.user = user;
        this.authService.setCurrentUser(user);
        this.populateForm(this.user);
      },
      error: (err) => {
        this.toastService.error('Failed to update profile. Please try again.');
        this.isLoading = false;
      }
    });
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
    if (!this.user || !this.isEditing) return;
    
    if (!this.user.notification_preferences) {
      this.user.notification_preferences = {
        email: true,
        push: true,
        in_app: true
      };
    }
    
    this.user.notification_preferences[type] = checked;
    this.authService.setCurrentUser(this.user);
  }

  copyUuid(uuid: string | undefined) {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    this.toastService.success('User ID copied to clipboard!');
  }
} 