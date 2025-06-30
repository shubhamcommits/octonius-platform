import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { GroupMemberService, GroupMember } from '../../../services/group-member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-group-admin',
  standalone: false,
  templateUrl: './group-admin.component.html',
  styleUrl: './group-admin.component.scss'
})
export class GroupAdminComponent implements OnInit, OnDestroy {
  group: WorkGroup | null = null;
  members: GroupMember[] = [];
  isLoading = false;
  isLoadingMembers = false;
  isSaving = false;
  
  // Current user info
  currentUser: any = null;
  
  // Active tab
  activeTab: 'general' | 'members' | 'permissions' | 'danger' = 'general';
  
  // Group form data
  groupForm = {
    name: '',
    description: '',
    imageUrl: '',
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      visibility: 'private' as 'public' | 'private',
      defaultRole: 'member' as 'member' | 'admin'
    },
    metadata: {
      tags: [] as string[],
      category: '',
      department: ''
    }
  };
  
  // Member management
  showAddMemberModal = false;
  newMemberEmail = '';
  newMemberRole: 'admin' | 'member' | 'viewer' = 'member';
  
  // Tag management
  newTag = '';
  
  // Delete confirmation
  showDeleteModal = false;
  deleteConfirmText = '';
  
  private groupSub: Subscription | null = null;

  constructor(
    private router: Router,
    private workGroupService: WorkGroupService,
    private groupMemberService: GroupMemberService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe(group => {
      this.group = group;
      if (group) {
        this.loadGroupDetails();
        this.loadMembers();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.groupSub) {
      this.groupSub.unsubscribe();
    }
  }

  loadGroupDetails(): void {
    if (!this.group) return;
    
    // Populate form with current group data
    this.groupForm = {
      name: this.group.name,
      description: this.group.description || '',
      imageUrl: this.group.imageUrl || '',
      settings: { ...this.group.settings },
      metadata: {
        tags: [...this.group.metadata.tags],
        category: this.group.metadata.category || '',
        department: this.group.metadata.department || ''
      }
    };
  }

  loadMembers(): void {
    if (!this.group) return;
    
    this.isLoadingMembers = true;
    this.groupMemberService.getMembers(this.group.uuid).subscribe({
      next: (members) => {
        this.members = members;
        this.isLoadingMembers = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.toastService.error('Failed to load group members');
        this.isLoadingMembers = false;
        // Fallback to mock data for demo
        this.members = [
          {
            uuid: '1',
            role: 'admin',
            status: 'active',
            joinedAt: new Date().toISOString(),
            user: {
              uuid: this.currentUser?.uuid || '1',
              firstName: this.currentUser?.first_name || 'John',
              lastName: this.currentUser?.last_name || 'Doe',
              email: this.currentUser?.email || 'john@example.com',
              avatarUrl: this.currentUser?.avatar_url || null,
              displayName: this.getUserDisplayName({
                first_name: this.currentUser?.first_name || 'John',
                last_name: this.currentUser?.last_name || 'Doe',
                email: this.currentUser?.email || 'john@example.com'
              }),
              initials: this.getUserInitials({
                first_name: this.currentUser?.first_name || 'John',
                last_name: this.currentUser?.last_name || 'Doe',
                email: this.currentUser?.email || 'john@example.com'
              })
            }
          }
        ];
      }
    });
  }

  // Tab management
  switchTab(tab: 'general' | 'members' | 'permissions' | 'danger'): void {
    this.activeTab = tab;
  }

  // General settings
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
      },
      error: (error) => {
        this.toastService.error('Failed to update group settings');
        this.isSaving = false;
      }
    });
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
      },
      error: (error) => {
        this.toastService.error('Failed to update permission settings');
        this.isSaving = false;
      }
    });
  }

  // Tag management
  addTag(): void {
    if (!this.newTag.trim()) return;
    
    if (!this.groupForm.metadata.tags.includes(this.newTag.trim())) {
      this.groupForm.metadata.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.groupForm.metadata.tags.splice(index, 1);
  }

  // Member management
  openAddMemberModal(): void {
    this.showAddMemberModal = true;
    this.newMemberEmail = '';
    this.newMemberRole = 'member';
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  addMember(): void {
    if (!this.group || !this.newMemberEmail.trim()) return;
    
    // Use invitation system for now
    this.groupMemberService.inviteMember(this.group.uuid, {
      email: this.newMemberEmail.trim(),
      role: this.newMemberRole
    }).subscribe({
      next: () => {
        this.toastService.success(`Invitation sent to ${this.newMemberEmail}`);
        this.closeAddMemberModal();
        this.loadMembers(); // Refresh member list
      },
      error: (error) => {
        this.toastService.error('Failed to send invitation');
      }
    });
  }

  updateMemberRole(member: GroupMember, newRole: 'admin' | 'member' | 'viewer'): void {
    if (!this.group) return;
    
    this.groupMemberService.updateMemberRole(this.group.uuid, member.uuid, newRole).subscribe({
      next: (updatedMember) => {
        // Update local member data
        const index = this.members.findIndex(m => m.uuid === member.uuid);
        if (index !== -1) {
          this.members[index] = updatedMember;
        }
        this.toastService.success(`${member.user.displayName}'s role updated to ${newRole}`);
      },
      error: (error) => {
        this.toastService.error('Failed to update member role');
      }
    });
  }

  removeMember(member: GroupMember): void {
    if (!this.group) return;
    
    if (confirm(`Are you sure you want to remove ${member.user.displayName} from this group?`)) {
      this.groupMemberService.removeMember(this.group.uuid, member.uuid).subscribe({
        next: () => {
          this.members = this.members.filter(m => m.uuid !== member.uuid);
          this.toastService.success('Member removed successfully');
        },
        error: (error) => {
          this.toastService.error('Failed to remove member');
        }
      });
    }
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
  getUserDisplayName(user: any): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  }

  getUserInitials(user: any): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`;
    }
    return user.email.charAt(0).toUpperCase();
  }

  isCurrentUserAdmin(): boolean {
    const currentMember = this.members.find(m => m.user.uuid === this.currentUser?.uuid);
    return currentMember?.role === 'admin';
  }

  canManageMembers(): boolean {
    return this.isCurrentUserAdmin();
  }

  canDeleteGroup(): boolean {
    return this.isCurrentUserAdmin();
  }
}
