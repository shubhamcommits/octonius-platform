import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { GroupMemberService, GroupMember } from '../../../services/group-member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { environment } from '../../../../../../environments/environment';

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
  showInviteMemberModal = false;
  newMemberEmail = '';
  newMemberRole: 'admin' | 'member' | 'viewer' = 'member';
  
  // User search for adding existing members
  userSearchQuery = '';
  searchResults: any[] = [];
  selectedUser: any = null;
  
  // Invite form
  inviteForm = {
    email: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
    message: ''
  };
  isSendingInvite = false;
  
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
    this.getCurrentUser();
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
        this.members.push({
          uuid: 'temp-' + Date.now(),
          role: 'member' as const,
          status: 'pending' as const,
          joinedAt: new Date().toISOString(),
          user: {
            uuid: this.currentUser?.uuid || '1',
            firstName: this.currentUser?.firstName || 'John',
            lastName: this.currentUser?.lastName || 'Doe',
            email: this.currentUser?.email || 'john@example.com',
            avatarUrl: this.currentUser?.avatarUrl || environment.defaultAvatarUrl,
            displayName: this.getUserDisplayName({
              firstName: this.currentUser?.firstName || 'John',
              lastName: this.currentUser?.lastName || 'Doe',
              email: this.currentUser?.email || 'john@example.com'
            }),
            initials: this.getUserInitials({
              firstName: this.currentUser?.firstName || 'John',
              lastName: this.currentUser?.lastName || 'Doe',
              email: this.currentUser?.email || 'john@example.com'
            })
          }
        });
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

  // Invite member functionality
  openInviteMemberModal(): void {
    this.showInviteMemberModal = true;
    this.inviteForm = {
      email: '',
      role: 'member',
      message: ''
    };
  }

  closeInviteMemberModal(): void {
    this.showInviteMemberModal = false;
  }

  sendInvitation(): void {
    if (!this.group || !this.inviteForm.email.trim() || !this.isValidEmail(this.inviteForm.email)) return;
    
    this.isSendingInvite = true;
    this.groupMemberService.inviteMember(this.group.uuid, {
      email: this.inviteForm.email.trim(),
      role: this.inviteForm.role,
      message: this.inviteForm.message?.trim()
    }).subscribe({
      next: () => {
        this.toastService.success(`Invitation sent to ${this.inviteForm.email}`);
        this.closeInviteMemberModal();
        this.loadMembers(); // Refresh member list
        this.isSendingInvite = false;
      },
      error: (error) => {
        this.toastService.error('Failed to send invitation');
        this.isSendingInvite = false;
      }
    });
  }

  // Add existing member functionality
  openAddMemberModal(): void {
    this.showAddMemberModal = true;
    this.userSearchQuery = '';
    this.searchResults = [];
    this.selectedUser = null;
    this.newMemberRole = 'member';
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  searchUsers(): void {
    if (!this.userSearchQuery.trim() || this.userSearchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    // Mock search results - in real app this would be an API call
    const mockUsers = [
      {
        uuid: 'user-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        avatarUrl: null,
        displayName: 'Jane Smith',
        initials: 'JS'
      },
      {
        uuid: 'user-2',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        avatarUrl: null,
        displayName: 'Bob Johnson',
        initials: 'BJ'
      },
      {
        uuid: 'user-3',
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        avatarUrl: null,
        displayName: 'Alice Williams',
        initials: 'AW'
      }
    ];

    // Filter mock users based on search query
    this.searchResults = mockUsers.filter(user => 
      user.displayName.toLowerCase().includes(this.userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(this.userSearchQuery.toLowerCase())
    ).filter(user => 
      // Exclude users who are already members
      !this.members.some(member => member.user.uuid === user.uuid)
    );
  }

  selectUser(user: any): void {
    this.selectedUser = user;
  }

  addMember(): void {
    if (!this.group || !this.selectedUser) return;
    
    // For now, use the invitation system for existing users too
    this.groupMemberService.inviteMember(this.group.uuid, {
      email: this.selectedUser.email,
      role: this.newMemberRole
    }).subscribe({
      next: () => {
        this.toastService.success(`${this.selectedUser.displayName} added to group`);
        this.closeAddMemberModal();
        this.loadMembers(); // Refresh member list
      },
      error: (error) => {
        this.toastService.error('Failed to add member');
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
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  }

  getUserInitials(user: any): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
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

  getCurrentUserRole(): string {
    const currentMember = this.members.find(m => m.user.uuid === this.currentUser?.uuid);
    return currentMember?.role || 'none';
  }

  // Utility methods
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getUserAvatarUrl(user: any): string {
    return user?.avatarUrl || user?.avatar_url || environment.defaultAvatarUrl;
  }

  // Mock current user - in real app this would come from AuthService
  private getCurrentUser() {
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.currentUser = {
          uuid: user.uuid,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          avatarUrl: user.avatar_url || environment.defaultAvatarUrl,
          displayName: user.first_name || user.last_name 
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : user.email,
          initials: user.first_name || user.last_name
            ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
            : user.email.charAt(0).toUpperCase()
        };
      }
    });
  }
}
