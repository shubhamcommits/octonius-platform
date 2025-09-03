import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../../services/work-group.service';
import { GroupMember, GroupMemberService } from '../../../../services/group-member.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { MemberActionsModalService } from '../services/member-actions-modal.service';
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
  newMemberRole: 'admin' | 'member' | 'viewer' = 'member';
  
  // Unified search for members
  memberSearchQuery = '';
  memberSearchResults: any[] = [];
  selectedMember: any = null;
  inviteMessage = '';
  

  
  private destroy$ = new Subject<void>();

  constructor(
    private workGroupService: WorkGroupService,
    private groupMemberService: GroupMemberService,
    private toastService: ToastService,
    private authService: AuthService,
    private memberActionsModalService: MemberActionsModalService,
    private cdr: ChangeDetectorRef
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
  }

  loadMembers(): void {
    if (!this.group) return;
    
    this.isLoadingMembers = true;
    this.cdr.detectChanges(); // Trigger change detection for loading state
    
    this.groupMemberService.getMembers(this.group.uuid).subscribe({
      next: (members) => {
        this.members = members;
        this.isLoadingMembers = false;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.toastService.error('Failed to load group members');
        this.isLoadingMembers = false;
        this.cdr.detectChanges(); // Trigger change detection on error
      }
    });
  }

  // Unified member management functionality
  openAddMemberModal(): void {
    this.showAddMemberModal = true;
    this.memberSearchQuery = '';
    this.memberSearchResults = [];
    this.selectedMember = null;
    this.newMemberRole = 'member';
    this.inviteMessage = '';
    this.cdr.detectChanges(); // Trigger change detection after opening modal
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
    this.cdr.detectChanges(); // Trigger change detection after closing modal
  }

  searchMembers(): void {
    if (!this.memberSearchQuery.trim() || this.memberSearchQuery.length < 2) {
      this.memberSearchResults = [];
      return;
    }

    const query = this.memberSearchQuery.trim();
    const results: any[] = [];

    // Search for existing users via API
    this.groupMemberService.searchAllUsers(query, 10).subscribe({
      next: (users) => {
        // Filter out users who are already members
        const existingUsers = users.filter(user => {
          const isAlreadyMember = this.members.some(member => 
            member.user.uuid === user.uuid || 
            member.user.email.toLowerCase() === user.email.toLowerCase()
          );
          return !isAlreadyMember;
        });

        // Transform and add existing users to results
        existingUsers.forEach(user => {
          const firstName = user.first_name || '';
          const lastName = user.last_name || '';
          const displayName = firstName || lastName 
            ? `${firstName} ${lastName}`.trim()
            : user.email;
          const initials = firstName || lastName
            ? `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
            : user.email.charAt(0).toUpperCase();

          results.push({
            id: `existing-${user.uuid}`,
            type: 'existing',
            uuid: user.uuid,
            displayName: displayName,
            email: user.email,
            initials: initials,
            avatarUrl: user.avatar_url
          });
        });

        // Check if search query looks like an email and add invite option
        if (this.isValidEmail(this.memberSearchQuery) && 
            !existingUsers.some(user => user.email.toLowerCase() === this.memberSearchQuery.toLowerCase())) {
          results.push({
            id: `invite-${this.memberSearchQuery}`,
            type: 'invite',
            displayName: this.memberSearchQuery,
            email: this.memberSearchQuery,
            initials: this.memberSearchQuery.charAt(0).toUpperCase()
          });
        }

        this.memberSearchResults = results;
        this.cdr.detectChanges(); // Trigger change detection after search results update
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.toastService.error('Failed to search users');
        this.memberSearchResults = [];
        this.cdr.detectChanges(); // Trigger change detection after clearing search results
      }
    });
  }

  selectMember(member: any): void {
    this.selectedMember = member;
    this.cdr.detectChanges(); // Trigger change detection after selecting member
  }

  createInviteFromSearch(): void {
    if (!this.memberSearchQuery.trim()) return;
    
    this.selectedMember = {
      id: `invite-${this.memberSearchQuery}`,
      type: 'invite',
      displayName: this.memberSearchQuery,
      email: this.memberSearchQuery,
      initials: this.memberSearchQuery.charAt(0).toUpperCase()
    };
  }

  addSelectedMember(): void {
    if (!this.group || !this.selectedMember) return;
    
    if (this.selectedMember.type === 'existing') {
      // Add existing user
      this.groupMemberService.addMember(this.group.uuid, this.selectedMember.uuid, this.newMemberRole).subscribe({
        next: () => {
          this.toastService.success(`${this.selectedMember.displayName} added to group`);
          this.closeAddMemberModal();
          this.loadMembers();
          this.cdr.detectChanges(); // Trigger change detection after adding member
        },
        error: (error) => {
          this.toastService.error('Failed to add member');
        }
      });
    } else if (this.selectedMember.type === 'invite') {
      // Send invitation
      this.groupMemberService.inviteMember(this.group.uuid, {
        email: this.selectedMember.email,
        role: this.newMemberRole,
        message: this.inviteMessage?.trim()
      }).subscribe({
        next: () => {
          this.toastService.success(`Invitation sent to ${this.selectedMember.email}`);
          this.closeAddMemberModal();
          this.loadMembers();
          this.cdr.detectChanges(); // Trigger change detection after sending invitation
        },
        error: (error) => {
          this.toastService.error('Failed to send invitation');
        }
      });
    }
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
        this.cdr.detectChanges(); // Trigger change detection after role update
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
          this.cdr.detectChanges(); // Trigger change detection after member removal
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

  // Modal management
  openMemberActionsModal(member: GroupMember): void {
    this.memberActionsModalService.openModal(member);
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
        this.cdr.detectChanges(); // Trigger change detection when user data is loaded
      }
    });
  }
}
