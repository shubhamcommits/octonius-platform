import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface WorkplaceData {
  uuid: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  timezone: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface WorkplaceStats {
  total_users: number;
  total_admins: number;
  total_members: number;
  total_agoras: number;
  total_work_groups: number;
}

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  workplace: WorkplaceData | null = null;
  workplaceStats: WorkplaceStats | null = null;
  settingsForm: FormGroup;
  isEditing = false;
  isLoading = false;
  logoPreview: string | null = null;
  currentUser: User | null = null;

  timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
    { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata, New Delhi' }
  ];

  industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Consulting', 'Real Estate', 'Media', 'Other'
  ];

  sizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      website: ['', [Validators.pattern('https?://.+')]],
      industry: [''],
      size: [''],
      timezone: ['UTC', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadWorkplaceData();
    this.loadWorkplaceStats();
  }

  loadWorkplaceData(): void {
    this.isLoading = true;
    const workplaceId = this.currentUser?.current_workplace_id;
    
    if (!workplaceId) {
      this.toastService.error('No workplace selected');
      this.isLoading = false;
      return;
    }

    // TODO: Replace with actual API call
    // Simulating API response
    setTimeout(() => {
      this.workplace = {
        uuid: workplaceId,
        name: 'ACME',
        description: 'Leading technology company focused on innovation',
        logo_url: undefined,
        website: 'https://acme.com',
        industry: 'Technology',
        size: '51-200',
        timezone: 'America/New_York',
        active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date()
      };
      
      if (this.workplace) {
        this.populateForm(this.workplace);
        this.logoPreview = this.workplace.logo_url || null;
      }
      this.isLoading = false;
    }, 500);
  }

  loadWorkplaceStats(): void {
    // Simulating stats from the screenshot
    this.workplaceStats = {
      total_users: 1006,
      total_admins: 6,
      total_members: 1000,
      total_agoras: 20,
      total_work_groups: 40
    };
  }

  populateForm(workplace: WorkplaceData): void {
    this.settingsForm.patchValue({
      name: workplace.name,
      description: workplace.description || '',
      website: workplace.website || '',
      industry: workplace.industry || '',
      size: workplace.size || '',
      timezone: workplace.timezone
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.workplace) {
      // Reset form if canceling
      this.populateForm(this.workplace);
      this.logoPreview = this.workplace.logo_url || null;
    }
  }

  onLogoSelected(event: Event): void {
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
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.toastService.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    const formData = this.settingsForm.value;
    
    // TODO: Implement actual API call to update workplace settings
    setTimeout(() => {
      this.toastService.success('Workplace settings updated successfully');
      this.isEditing = false;
      this.isLoading = false;
      
      // Update local workplace data
      if (this.workplace) {
        this.workplace = {
          ...this.workplace,
          ...formData,
          logo_url: this.logoPreview || this.workplace.logo_url,
          updated_at: new Date()
        };
      }
    }, 1000);
  }

  inviteMembers(): void {
    // TODO: Implement invite members functionality
    this.toastService.info('Invite members feature coming soon!');
  }

  manageBilling(): void {
    // TODO: Implement billing management
    this.toastService.info('Billing management feature coming soon!');
  }
} 