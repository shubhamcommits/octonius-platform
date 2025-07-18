import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil, distinctUntilChanged } from 'rxjs';
import { WorkplaceSettingsService, WorkplaceData, WorkplaceStats, WorkplaceSettingsUpdate, WorkplaceMember, WorkplaceInvitation } from '../../../core/services/workplace-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { FileService } from '../../../core/services/file.service';
import { ToastService } from '../../../core/services/toast.service';
import { RoleService, Role, Permission, PermissionsByCategory } from '../../../core/services/role.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  workplaceStats: WorkplaceStats | null = null;
  workplace: WorkplaceData | null = null;
  logoPreview: string | null = null;
  uploading = false;
  bioCharacterCount = 0;
  workplaceMembers: WorkplaceMember[] = [];
  
  // Pagination properties  
  membersPagination = {
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true,
    search: '',
    loading: false
  };
  
  invitationsPagination = {
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true,
    search: '',
    loading: false
  };
  
  rolesPagination = {
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true,
    search: '',
    loading: false
  };

  // Autosave
  private destroy$ = new Subject<void>();
  private autosaveTimeout: any;
  private originalValues: any = {};

  // Dropdown state
  openDropdown: string | null = null;
  showRoleDropdown = false;

  // Invitation properties
  showInviteModal = false;
  invitations: WorkplaceInvitation[] = [];
  isLoadingInvitations = false;
  sendingInvite = false;
  selectedRole = '';
  availableRoles: any[] = [];
  inviteForm = {
    email: '',
    roleId: '',
    message: ''
  };
  activeTab: 'members' | 'invitations' | 'roles' = 'members';

  // Role management properties
  roles: Role[] = [];
  isLoadingRoles = false;
  showRoleModal = false;
  editingRole: Role | null = null;
  deletingRole: Role | null = null;
  showDeleteRoleModal = false;
  systemPermissions: PermissionsByCategory = {};
  permissionCategories: { [key: string]: string } = {};
  roleForm = {
    name: '',
    description: '',
    permissions: [] as string[]
  };
  selectedPermissionCategory = '';
  savingRole = false;

  // Industries and sizes
  industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Real Estate', 'Consulting', 'Marketing', 'Legal',
    'Non-profit', 'Government', 'Entertainment', 'Transportation', 'Other'
  ];

  sizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' }
  ];

  constructor(
    private fb: FormBuilder,
    private workplaceSettingsService: WorkplaceSettingsService,
    private authService: AuthService,
    private fileService: FileService,
    private toastService: ToastService,
    private roleService: RoleService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadWorkplaceSettings();
    this.setupAutosave();
    
    // Add document click listener for dropdowns
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autosaveTimeout) {
      clearTimeout(this.autosaveTimeout);
    }
    
    // Remove document click listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      industry: [''],
      size: [''],
      timezone: ['UTC', Validators.required],
      description: ['', [Validators.maxLength(500)]],
      logo_url: ['']
    });
  }

  private setupAutosave(): void {
    this.settingsForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(2000),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.settingsForm.valid) {
          this.autosave();
        }
      });

    // Watch bio character count
    this.settingsForm.get('description')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.bioCharacterCount = value?.length || 0;
      });
  }

  private autosave(): void {
    if (this.autosaveTimeout) {
      clearTimeout(this.autosaveTimeout);
    }

    this.autosaveTimeout = setTimeout(() => {
      if (this.settingsForm.valid) {
        this.saveSettings(true);
      }
    }, 1000);
  }

  private loadWorkplaceSettings(): void {
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const workplaceId = currentUser?.current_workplace_id;

    if (!workplaceId) {
      this.toastService.error('No workplace selected');
      this.isLoading = false;
      return;
    }

    this.workplaceSettingsService.getWorkplaceById(workplaceId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.workplace = response.workplace;
            const formData = {
              name: response.workplace.name,
              website: response.workplace.website || '',
              industry: response.workplace.industry || '',
              size: response.workplace.size || '',
              timezone: response.workplace.timezone || 'UTC',
              description: response.workplace.description || '',
              logo_url: response.workplace.logo_url || ''
            };
            
            this.settingsForm.patchValue(formData);
            this.originalValues = { ...formData };

            if (response.workplace.logo_url) {
              this.logoPreview = response.workplace.logo_url;
            }
            
            // Load all data after workplace is loaded
            this.loadRoles();
            this.loadInvitations();
          } else {
            this.toastService.error(response.message || 'Failed to load workplace settings');
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading workplace settings:', error);
          this.toastService.error('Failed to load workplace settings');
          this.isLoading = false;
        }
      });

    // Load workplace stats
    this.workplaceSettingsService.getWorkplaceStats(workplaceId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.workplaceStats = response.stats;
          }
        },
        error: (error: any) => {
          console.error('Error loading workplace stats:', error);
        }
      });

    // Load workplace members
    this.loadWorkplaceMembers(workplaceId);
  }

  private loadWorkplaceMembers(workplaceId: string, append: boolean = false): void {
    if (!append) {
      this.membersPagination.offset = 0;
      this.workplaceMembers = [];
    }
    
    this.membersPagination.loading = true;
    
    this.workplaceSettingsService.getWorkplaceMembers(workplaceId, {
      limit: this.membersPagination.limit,
      offset: this.membersPagination.offset,
      search: this.membersPagination.search
    })
      .subscribe({
        next: (response) => {
          if (response.success) {
            const paginatedData = response.members;
            if (paginatedData && paginatedData.data) {
              if (append) {
                this.workplaceMembers = [...this.workplaceMembers, ...paginatedData.data];
              } else {
                this.workplaceMembers = paginatedData.data;
              }
              this.membersPagination.total = paginatedData.pagination?.total || 0;
              this.membersPagination.hasMore = paginatedData.pagination?.hasMore || false;
            } else {
              // Handle case where paginatedData is undefined
              if (!append) {
                this.workplaceMembers = [];
              }
              this.membersPagination.total = 0;
              this.membersPagination.hasMore = false;
            }
            this.membersPagination.loading = false;
          }
        },
        error: (error: any) => {
          console.error('Error loading workplace members:', error);
          this.toastService.error('Failed to load workplace members');
          this.membersPagination.loading = false;
        }
      });
  }

  private getChangedFields(): WorkplaceSettingsUpdate {
    const currentValues = this.settingsForm.value;
    const changedFields: WorkplaceSettingsUpdate = {};

    Object.keys(currentValues).forEach(key => {
      const currentValue = currentValues[key];
      const originalValue = this.originalValues[key];
      
      // Only include fields that have actually changed
      if (currentValue !== originalValue) {
        changedFields[key as keyof WorkplaceSettingsUpdate] = currentValue;
      }
    });

    return changedFields;
  }

  saveSettings(isAutosave = false): void {
    if (this.settingsForm.invalid) {
      return;
    }

    const changedFields = this.getChangedFields();
    
    // Don't save if nothing has changed
    if (Object.keys(changedFields).length === 0) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const workplaceId = currentUser?.current_workplace_id;

    if (!workplaceId) {
      this.toastService.error('No workplace selected');
      return;
    }

    this.isSaving = true;

    this.workplaceSettingsService.updateWorkplaceSettings(workplaceId, changedFields)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.workplace = response.workplace;
            
            // Update original values with new values
            const newFormData = {
              name: response.workplace.name,
              website: response.workplace.website || '',
              industry: response.workplace.industry || '',
              size: response.workplace.size || '',
              timezone: response.workplace.timezone || 'UTC',
              description: response.workplace.description || '',
              logo_url: response.workplace.logo_url || ''
            };
            
            this.originalValues = { ...newFormData };
            this.settingsForm.patchValue(newFormData);

            if (response.workplace.logo_url) {
              this.logoPreview = response.workplace.logo_url;
            }

            this.isSaving = false;
            
            if (!isAutosave) {
              this.toastService.success('Settings saved successfully');
            }
          } else {
            this.toastService.error(response.message || 'Failed to save workplace settings');
            this.isSaving = false;
          }
        },
        error: (error: any) => {
          console.error('Error saving workplace settings:', error);
          this.toastService.error('Failed to save workplace settings');
          this.isSaving = false;
        }
      });
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('File size must be less than 5MB');
      return;
    }

    this.uploading = true;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to S3
    this.uploadLogo(file);
  }

  private uploadLogo(file: File): void {
    // For workplace logo uploads, we don't pass group_id (it's null)
    this.fileService.uploadFileViaS3(file).subscribe({
      next: (uploadedFile: any) => {
        const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url;
        this.logoPreview = url;
        this.settingsForm.patchValue({ logo_url: url });
        this.uploading = false;
        this.toastService.success('Logo uploaded successfully');
        
        // Auto-save the logo change
        this.autosave();
      },
      error: (error: any) => {
        console.error('Error uploading logo:', error);
        this.toastService.error('Failed to upload logo. Please try again.');
        this.uploading = false;
        this.logoPreview = null;
        
        // Reset the file input
        const input = document.getElementById('logo-upload') as HTMLInputElement;
        if (input) {
          input.value = '';
        }
      }
    });
  }

  clearLogoUpload(): void {
    this.logoPreview = null;
    this.settingsForm.patchValue({ logo_url: '' });
    
    // Clear the file input
    const input = document.getElementById('logo-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    
    // Auto-save the logo removal
    this.autosave();
    this.toastService.success('Logo removed successfully');
  }

  manageBilling(): void {
    // TODO: Implement billing management
    this.toastService.info('Billing management feature coming soon!');
  }

  inviteMembers(): void {
    // TODO: Implement invite members functionality
    this.toastService.info('Invite members functionality coming soon');
  }

  addExistingUser(): void {
    // TODO: Implement add existing user functionality
    this.toastService.info('Add existing user functionality coming soon');
  }

  editMember(member: WorkplaceMember): void {
    // TODO: Implement edit member functionality
    this.toastService.info(`Edit member ${member.first_name} ${member.last_name} functionality coming soon`);
  }

  removeMember(member: WorkplaceMember): void {
    // TODO: Implement remove member functionality
    this.toastService.info(`Remove member ${member.first_name} ${member.last_name} functionality coming soon`);
  }

  getDisplayDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  // Invitation methods
  openInviteModal(): void {
    this.showInviteModal = true;
    this.inviteForm = {
      email: '',
      roleId: '',
      message: ''
    };
    
    // Set available roles from already loaded roles
    if (this.roles.length > 0) {
      this.availableRoles = this.roles.map(role => ({
        uuid: role.uuid,
        name: role.name,
        label: role.name
      }));
      
      // Set default role to 'member' if available, otherwise use first role
      const memberRole = this.availableRoles.find(r => r.name.toLowerCase() === 'member');
      this.inviteForm.roleId = memberRole?.uuid || this.availableRoles[0]?.uuid || '';
    }
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    this.showRoleDropdown = false;
    this.inviteForm = {
      email: '',
      roleId: '',
      message: ''
    };
  }

  loadAvailableRoles(): void {
    // Use the roles already loaded from backend
    if (this.roles.length === 0) {
      // If roles haven't been loaded yet, load them
      this.loadRoles();
    } else {
      // Use existing roles
      this.availableRoles = this.roles.map(role => ({
        uuid: role.uuid,
        name: role.name,
        label: role.name
      }));
      
      // Set default role to 'member' if available, otherwise use first role
      if (this.availableRoles.length > 0) {
        this.inviteForm.roleId = this.availableRoles.find(r => r.name.toLowerCase() === 'member')?.uuid || this.availableRoles[0].uuid;
      }
    }
  }

  sendInvitation(): void {
    if (!this.inviteForm.email || !this.inviteForm.roleId || !this.workplace?.uuid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.inviteForm.email)) {
      this.toastService.error('Please enter a valid email address');
      return;
    }

    this.sendingInvite = true;
    this.workplaceSettingsService.createInvitation(
      this.workplace!.uuid,
      this.inviteForm.email,
      this.inviteForm.roleId,
      this.inviteForm.message
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Invitation sent successfully');
          this.closeInviteModal();
          this.loadInvitations();
        } else {
          this.toastService.error(response.message || 'Failed to send invitation');
        }
        this.sendingInvite = false;
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        this.toastService.error(error.error?.message || 'Failed to send invitation');
        this.sendingInvite = false;
      }
    });
  }

  loadInvitations(append: boolean = false): void {
    if (!this.workplace?.uuid) return;

    if (!append) {
      this.invitationsPagination.offset = 0;
      this.invitations = [];
    }
    
    this.invitationsPagination.loading = true;
    
    this.workplaceSettingsService.getWorkplaceInvitations(this.workplace.uuid, {
      limit: this.invitationsPagination.limit,
      offset: this.invitationsPagination.offset,
      search: this.invitationsPagination.search
    }).subscribe({
      next: (response) => {
        console.log('Invitations API response:', response);
        if (response.success) {
          // Check if response.invitations is an array directly
          if (Array.isArray(response.invitations)) {
            // Direct array response (not paginated)
            if (append) {
              this.invitations = [...this.invitations, ...response.invitations];
            } else {
              this.invitations = response.invitations;
            }
            this.invitationsPagination.total = response.invitations.length;
            this.invitationsPagination.hasMore = false;
          } else if (response.invitations && response.invitations.data) {
            // Paginated response
            const paginatedData = response.invitations;
            if (append) {
              this.invitations = [...this.invitations, ...paginatedData.data];
            } else {
              this.invitations = paginatedData.data;
            }
            this.invitationsPagination.total = paginatedData.pagination?.total || 0;
            this.invitationsPagination.hasMore = paginatedData.pagination?.hasMore || false;
          } else {
            // Handle case where invitations data is undefined
            console.warn('No invitations data in response');
            if (!append) {
              this.invitations = [];
            }
            this.invitationsPagination.total = 0;
            this.invitationsPagination.hasMore = false;
          }
          this.invitationsPagination.loading = false;
          console.log('Invitations after loading:', this.invitations);
        }
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
        this.toastService.error('Failed to load invitations');
        this.invitationsPagination.loading = false;
      }
    });
  }

  // Pagination methods
  loadMoreMembers(): void {
    if (!this.workplace?.uuid || !this.membersPagination.hasMore) return;
    this.membersPagination.offset += this.membersPagination.limit;
    this.loadWorkplaceMembers(this.workplace.uuid, true);
  }
  
  loadMoreInvitations(): void {
    if (!this.workplace?.uuid || !this.invitationsPagination.hasMore) return;
    this.invitationsPagination.offset += this.invitationsPagination.limit;
    this.loadInvitations(true);
  }
  
  loadMoreRoles(): void {
    if (!this.rolesPagination.hasMore) return;
    this.rolesPagination.offset += this.rolesPagination.limit;
    this.loadRoles(true);
  }
  
  // Search methods
  onMembersSearch(search: string): void {
    if (!this.workplace?.uuid) return;
    this.membersPagination.search = search;
    this.loadWorkplaceMembers(this.workplace.uuid);
  }
  
  onInvitationsSearch(search: string): void {
    if (!this.workplace?.uuid) return;
    this.invitationsPagination.search = search;
    this.loadInvitations();
  }
  
  onRolesSearch(search: string): void {
    this.rolesPagination.search = search;
    this.loadRoles();
  }

  cancelInvitation(invitationId: string): void {
    this.dialogService.confirm({
      title: 'Cancel Invitation',
      message: 'Are you sure you want to cancel this invitation?',
      confirmText: 'Cancel Invitation',
      cancelText: 'Keep Invitation',
      type: 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.workplaceSettingsService.cancelInvitation(invitationId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Invitation cancelled');
            this.loadInvitations();
          } else {
            this.toastService.error(response.message || 'Failed to cancel invitation');
          }
        },
        error: (error) => {
          console.error('Error cancelling invitation:', error);
          this.toastService.error('Failed to cancel invitation');
        }
      });
    });
  }

  getInvitationStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge badge-warning badge-sm';
      case 'accepted':
        return 'badge badge-success badge-sm';
      case 'rejected':
        return 'badge badge-error badge-sm';
      case 'expired':
        return 'badge badge-ghost badge-sm';
      default:
        return 'badge badge-sm';
    }
  }

  formatInvitationDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  switchTab(tab: 'members' | 'invitations' | 'roles'): void {
    this.activeTab = tab;
  }

  // Helper methods for template expressions
  isFieldValid(fieldName: string): boolean {
    const control = this.settingsForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.settingsForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  isFieldTouched(fieldName: string): boolean {
    const control = this.settingsForm.get(fieldName);
    return control ? control.touched : false;
  }

  // Dropdown methods
  toggleDropdown(fieldName: string): void {
    if (this.openDropdown === fieldName) {
      this.openDropdown = null;
    } else {
      this.openDropdown = fieldName;
    }
  }

  selectOption(fieldName: string, value: string): void {
    this.settingsForm.get(fieldName)?.setValue(value);
    this.openDropdown = null;
  }

  getSizeLabel(value: string): string {
    const size = this.sizes.find(s => s.value === value);
    return size ? size.label : '';
  }

  getTimezoneLabel(value: string): string {
    const tz = this.timezones.find(t => t.value === value);
    return tz ? tz.label : '';
  }

  getSelectedRoleLabel(): string {
    const role = this.availableRoles.find(r => r.uuid === this.inviteForm.roleId);
    return role ? role.label : 'Select a role';
  }

  // Close dropdown when clicking outside
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.openDropdown = null;
    }
  }

  // Role Management Methods
  loadRoles(append: boolean = false): void {
    if (!this.workplace) return;
    
    if (!append) {
      this.rolesPagination.offset = 0;
      this.roles = [];
    }
    
    this.rolesPagination.loading = true;
    
    // TODO: Update roleService.getWorkplaceRoles to support pagination
    this.roleService.getWorkplaceRoles(this.workplace.uuid)
      .subscribe({
        next: (response) => {
          const roles = response.roles || [];
          
          if (append) {
            this.roles = [...this.roles, ...roles];
          } else {
            this.roles = roles;
          }
          
          // For now, assume no pagination from backend for roles
          this.rolesPagination.total = this.roles.length;
          this.rolesPagination.hasMore = false;
          this.rolesPagination.loading = false;
          
          // Update available roles for invitation dropdown
          this.availableRoles = this.roles.map(role => ({
            uuid: role.uuid,
            name: role.name,
            label: role.name
          }));
        },
        error: (error) => {
          this.toastService.error('Failed to load roles');
          this.isLoadingRoles = false;
        }
      });
  }

  loadPermissions(): void {
    this.roleService.getSystemPermissions()
      .subscribe({
        next: (response) => {
          this.systemPermissions = response.permissions || {};
          this.permissionCategories = response.categories || {};
          // Set initial category
          const categories = Object.keys(this.permissionCategories);
          if (categories.length > 0) {
            this.selectedPermissionCategory = categories[0];
          }
        },
        error: (error) => {
          this.toastService.error('Failed to load permissions');
        }
      });
  }

  openRoleModal(role?: Role): void {
    this.editingRole = role || null;
    if (role) {
      this.roleForm = {
        name: role.name,
        description: role.description,
        permissions: role.permissions ? [...role.permissions] : []
      };
    } else {
      this.roleForm = {
        name: '',
        description: '',
        permissions: []
      };
    }
    this.showRoleModal = true;
    if (!this.systemPermissions || Object.keys(this.systemPermissions).length === 0) {
      this.loadPermissions();
    }
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.editingRole = null;
    this.roleForm = {
      name: '',
      description: '',
      permissions: []
    };
  }

  togglePermission(permissionName: string): void {
    if (!this.roleForm.permissions) {
      this.roleForm.permissions = [];
    }
    const index = this.roleForm.permissions.indexOf(permissionName);
    if (index > -1) {
      this.roleForm.permissions.splice(index, 1);
    } else {
      this.roleForm.permissions.push(permissionName);
    }
  }

  toggleAllPermissionsInCategory(category: string): void {
    if (!this.roleForm.permissions) {
      this.roleForm.permissions = [];
    }
    if (!category || !this.systemPermissions) {
      return;
    }
    const categoryPermissions = this.systemPermissions[category] || [];
    const allSelected = categoryPermissions.length > 0 && categoryPermissions.every(p => this.roleForm.permissions && this.roleForm.permissions.includes(p.name));
    
    if (allSelected) {
      // Remove all permissions from this category
      categoryPermissions.forEach(p => {
        const index = this.roleForm.permissions.indexOf(p.name);
        if (index > -1) {
          this.roleForm.permissions.splice(index, 1);
        }
      });
    } else {
      // Add all permissions from this category
      categoryPermissions.forEach(p => {
        if (!this.roleForm.permissions.includes(p.name)) {
          this.roleForm.permissions.push(p.name);
        }
      });
    }
  }

  saveRole(): void {
    if (!this.workplace || !this.roleForm.name || !this.roleForm.description) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.savingRole = true;
    
    if (this.editingRole) {
      // Update existing role
      this.roleService.updateRole(this.editingRole.uuid, this.roleForm)
        .subscribe({
          next: (response) => {
            this.toastService.success('Role updated successfully');
            this.closeRoleModal();
            this.loadRoles();
            this.savingRole = false;
          },
          error: (error) => {
            this.toastService.error(error.error?.message || 'Failed to update role');
            this.savingRole = false;
          }
        });
    } else {
      // Create new role
      this.roleService.createRole(this.workplace.uuid, this.roleForm)
        .subscribe({
          next: (response) => {
            this.toastService.success('Role created successfully');
            this.closeRoleModal();
            this.loadRoles();
            this.savingRole = false;
          },
          error: (error) => {
            this.toastService.error(error.error?.message || 'Failed to create role');
            this.savingRole = false;
          }
        });
    }
  }

  confirmDeleteRole(role: Role): void {
    if (role.is_system) {
      this.toastService.error('System roles cannot be deleted');
      return;
    }
    this.deletingRole = role;
    this.showDeleteRoleModal = true;
  }

  deleteRole(): void {
    if (!this.deletingRole) return;

    this.roleService.deleteRole(this.deletingRole.uuid)
      .subscribe({
        next: (response) => {
          this.toastService.success('Role deleted successfully');
          this.showDeleteRoleModal = false;
          this.deletingRole = null;
          this.loadRoles();
        },
        error: (error) => {
          this.toastService.error(error.error?.message || 'Failed to delete role');
          this.showDeleteRoleModal = false;
        }
      });
  }

  assignRoleToMember(userId: string, roleId: string): void {
    if (!this.workplace) return;

    this.roleService.assignRole(this.workplace.uuid, userId, roleId)
      .subscribe({
        next: (response) => {
          this.toastService.success('Role assigned successfully');
          this.loadWorkplaceMembers(this.workplace!.uuid);
        },
        error: (error) => {
          this.toastService.error(error.error?.message || 'Failed to assign role');
        }
      });
  }

  getCategoryName(category: string): string {
    return this.permissionCategories?.[category] || category;
  }

  hasPermission(permissionName: string): boolean {
    return this.roleForm.permissions && this.roleForm.permissions.includes(permissionName);
  }

  areAllPermissionsInCategorySelected(category: string): boolean {
    const categoryPermissions = this.systemPermissions?.[category] || [];
    return categoryPermissions.length > 0 && 
           categoryPermissions.every(p => this.hasPermission(p.name));
  }

  canEditRole(role: Role): boolean {
    return !role.is_system;
  }

  // Safe length getters
  get workplaceMembersCount(): number {
    return this.workplaceMembers?.length || 0;
  }

  get invitationsCount(): number {
    return this.invitations?.length || 0;
  }

  get rolesCount(): number {
    return this.roles?.length || 0;
  }

  get roleFormPermissionsCount(): number {
    return this.roleForm?.permissions?.length || 0;
  }

  get selectedCategoryPermissionsCount(): number {
    return this.systemPermissions?.[this.selectedPermissionCategory]?.length || 0;
  }

  get currentCategoryPermissions(): any[] {
    if (!this.systemPermissions || !this.selectedPermissionCategory) {
      return [];
    }
    return this.systemPermissions[this.selectedPermissionCategory] || [];
  }

  getRolePermissionsDisplay(role: Role): string {
    if (!role?.permissions || !Array.isArray(role.permissions)) {
      return '0 permissions';
    }
    if (role.permissions.includes('*')) {
      return 'All permissions';
    }
    return `${role.permissions.length} permissions`;
  }

  canDeleteRole(role: Role): boolean {
    return !role.is_system;
  }
} 