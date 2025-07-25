import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../../services/work-group.service';
import { GroupMember, GroupMemberService } from '../../../../services/group-member.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-danger-zone',
  standalone: false,
  templateUrl: './admin-danger-zone.component.html',
  styleUrl: './admin-danger-zone.component.scss'
})
export class AdminDangerZoneComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  members: GroupMember[] = [];
  currentUser: any = null;
  
  // Delete confirmation
  showDeleteModal = false;
  deleteConfirmText = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private workGroupService: WorkGroupService,
    private groupMemberService: GroupMemberService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.workGroupService.getCurrentGroup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        this.group = group || undefined;
        if (group) {
          this.loadMembers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up any open modals
    this.showDeleteModal = false;
  }

  loadMembers(): void {
    if (!this.group) return;
    
    this.groupMemberService.getMembers(this.group.uuid).subscribe({
      next: (members) => {
        this.members = members;
      },
      error: (error) => {
        console.error('Error loading members:', error);
      }
    });
  }

  // Group deletion
  openDeleteModal(): void {
    this.showDeleteModal = true;
    this.deleteConfirmText = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  deleteGroup(): void {
    if (!this.group || this.deleteConfirmText !== this.group.name) return;
    
    this.workGroupService.deleteGroup(this.group.uuid).subscribe({
      next: () => {
        this.toastService.success('Group deleted successfully');
        this.router.navigate(['/workplace/work-management']);
      },
      error: (error) => {
        this.toastService.error('Failed to delete group');
      }
    });
  }

  // Utility methods
  isCurrentUserAdmin(): boolean {
    const currentMember = this.members.find(m => m.user.uuid === this.currentUser?.uuid);
    return currentMember?.role === 'admin';
  }

  canDeleteGroup(): boolean {
    return this.isCurrentUserAdmin();
  }

  getCurrentUserRole(): string {
    const currentMember = this.members.find(m => m.user.uuid === this.currentUser?.uuid);
    return currentMember?.role || 'none';
  }

  // Mock current user - in real app this would come from AuthService
  private getCurrentUser() {
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.currentUser = {
          uuid: user.uuid,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        };
      }
    });
  }
}
