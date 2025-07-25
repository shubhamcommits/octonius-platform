import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../../services/work-group.service';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-permissions',
  standalone: false,
  templateUrl: './admin-permissions.component.html',
  styleUrl: './admin-permissions.component.scss'
})
export class AdminPermissionsComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  isSaving = false;
  
  // Group form data for permissions
  groupForm = {
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      visibility: 'private' as 'public' | 'private',
      defaultRole: 'member' as 'member' | 'admin' | 'viewer'
    }
  };
  
  private destroy$ = new Subject<void>();
  private originalSettings: any = null;

  constructor(
    private workGroupService: WorkGroupService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Subscribe to the current group
    this.workGroupService.getCurrentGroup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        this.group = group || undefined;
        if (group) {
          this.loadGroupSettings();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroupSettings(): void {
    if (!this.group) return;
    
    // Populate form with current group settings
    this.groupForm.settings = { ...this.group.settings };
    // Deep copy for dirty check
    this.originalSettings = JSON.parse(JSON.stringify(this.groupForm.settings));
  }

  savePermissionSettings(): void {
    if (!this.group) return;
    
    this.isSaving = true;
    this.workGroupService.updateGroup(this.group.uuid, {
      settings: this.groupForm.settings
    }).subscribe({
      next: (updatedGroup) => {
        this.workGroupService.setCurrentGroup(updatedGroup);
        this.toastService.success('Permission settings updated successfully');
        this.isSaving = false;
        // Update original settings for dirty check
        this.originalSettings = JSON.parse(JSON.stringify(this.groupForm.settings));
      },
      error: (error) => {
        this.toastService.error('Failed to update permission settings');
        this.isSaving = false;
      }
    });
  }

  resetToDefaults(): void {
    if (this.originalSettings) {
      this.groupForm.settings = JSON.parse(JSON.stringify(this.originalSettings));
    }
  }

  get isFormDirty(): boolean {
    if (!this.originalSettings) return false;
    return JSON.stringify(this.groupForm.settings) !== JSON.stringify(this.originalSettings);
  }
}
