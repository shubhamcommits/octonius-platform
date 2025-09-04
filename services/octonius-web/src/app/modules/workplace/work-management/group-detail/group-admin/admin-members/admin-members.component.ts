import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../../services/work-group.service';
import { GroupMember, GroupMemberService } from '../../../../services/group-member.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-admin-members',
  standalone: false,
  templateUrl: './admin-members.component.html',
  styleUrl: './admin-members.component.scss'
})
export class AdminMembersComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  members: GroupMember[] = [];
  isLoadingMembers = false;
  currentUser: any = null;
  
  // Member management
  showAddMemberModal = false;
  showInviteMemberModal = false;
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
  
  private destroy$ = new Subject<void>();

  constructor(
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
    this.showAddMemberModal = false;
    this.showInviteMemberModal = false;
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
      }
    });
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

  // Utility methods
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getUserAvatarUrl(user: any): string {
    return user?.avatarUrl || user?.avatar_url || environment.defaultAvatarUrl;
  }

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
