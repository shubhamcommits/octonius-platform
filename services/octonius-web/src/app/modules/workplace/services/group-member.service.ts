import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Backend response interfaces
interface BackendMember {
  uuid: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joined_at: string;
  user: {
    uuid: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data?: T;
  members?: T[];
  member?: T;
}

// Frontend interface
export interface GroupMember {
  uuid: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  user: {
    uuid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    displayName: string;
    initials: string;
  };
}

export interface MemberInvitation {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export interface MemberStats {
  total: number;
  active: number;
  pending: number;
  admins: number;
  members: number;
  viewers: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupMemberService {
  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) { }

  /**
   * Transform backend member data to frontend format
   */
  private transformMember(backendMember: BackendMember): GroupMember {
    const firstName = backendMember.user.first_name;
    const lastName = backendMember.user.last_name;
    const displayName = firstName || lastName 
      ? `${firstName || ''} ${lastName || ''}`.trim()
      : backendMember.user.email;
    const initials = firstName || lastName
      ? `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
      : backendMember.user.email.charAt(0).toUpperCase();

    return {
      uuid: backendMember.uuid,
      role: backendMember.role,
      status: backendMember.status,
      joinedAt: backendMember.joined_at,
      user: {
        uuid: backendMember.user.uuid,
        firstName: backendMember.user.first_name,
        lastName: backendMember.user.last_name,
        email: backendMember.user.email,
        avatarUrl: backendMember.user.avatar_url || environment.defaultAvatarUrl,
        displayName,
        initials
      }
    };
  }

  /**
   * Get all members of a group
   */
  getMembers(groupId: string): Observable<GroupMember[]> {
    return this.http.get<BackendResponse<BackendMember>>(`${this.apiUrl}/${groupId}/members`)
      .pipe(
        map(response => {
          if (!response.success || !response.members) {
            throw new Error(response.message || 'Failed to fetch members');
          }
          return response.members.map(member => this.transformMember(member));
        }),
        catchError(error => {
          console.error('Error fetching group members:', error);
          return throwError(() => new Error('Failed to load group members'));
        })
      );
  }

  /**
   * Get member statistics for a group
   */
  getMemberStats(groupId: string): Observable<MemberStats> {
    return this.getMembers(groupId).pipe(
      map(members => {
        const stats: MemberStats = {
          total: members.length,
          active: members.filter(m => m.status === 'active').length,
          pending: members.filter(m => m.status === 'pending').length,
          admins: members.filter(m => m.role === 'admin').length,
          members: members.filter(m => m.role === 'member').length,
          viewers: members.filter(m => m.role === 'viewer').length
        };
        return stats;
      })
    );
  }

  /**
   * Add a member to a group
   */
  addMember(groupId: string, userId: string, role: 'admin' | 'member' | 'viewer' = 'member'): Observable<GroupMember> {
    const payload = {
      user_id: userId,
      role: role
    };

    return this.http.post<BackendResponse<BackendMember>>(`${this.apiUrl}/${groupId}/members`, payload)
      .pipe(
        map(response => {
          if (!response.success || !response.member) {
            throw new Error(response.message || 'Failed to add member');
          }
          return this.transformMember(response.member);
        }),
        catchError(error => {
          console.error('Error adding member:', error);
          return throwError(() => new Error('Failed to add member to group'));
        })
      );
  }

  /**
   * Invite a member by email
   */
  inviteMember(groupId: string, invitation: MemberInvitation): Observable<any> {
    const payload = {
      email: invitation.email,
      role: invitation.role,
      message: invitation.message
    };

    return this.http.post<BackendResponse<any>>(`${this.apiUrl}/${groupId}/invite`, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to send invitation');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error inviting member:', error);
          return throwError(() => new Error('Failed to send invitation'));
        })
      );
  }

  /**
   * Update member role
   */
  updateMemberRole(groupId: string, memberId: string, role: 'admin' | 'member' | 'viewer'): Observable<GroupMember> {
    const payload = { role };

    return this.http.put<BackendResponse<BackendMember>>(`${this.apiUrl}/${groupId}/members/${memberId}`, payload)
      .pipe(
        map(response => {
          if (!response.success || !response.member) {
            throw new Error(response.message || 'Failed to update member role');
          }
          return this.transformMember(response.member);
        }),
        catchError(error => {
          console.error('Error updating member role:', error);
          return throwError(() => new Error('Failed to update member role'));
        })
      );
  }

  /**
   * Remove a member from a group
   */
  removeMember(groupId: string, memberId: string): Observable<void> {
    return this.http.delete<BackendResponse<void>>(`${this.apiUrl}/${groupId}/members/${memberId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to remove member');
          }
        }),
        catchError(error => {
          console.error('Error removing member:', error);
          return throwError(() => new Error('Failed to remove member'));
        })
      );
  }

  /**
   * Search for users to invite (workplace members)
   */
  searchUsers(workplaceId: string, query: string): Observable<any[]> {
    const params = new HttpParams()
      .set('workplace_id', workplaceId)
      .set('q', query);

    return this.http.get<BackendResponse<any>>(`${environment.apiUrl}/users/search`, { params })
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to search users');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error searching users:', error);
          return throwError(() => new Error('Failed to search users'));
        })
      );
  }

  /**
   * Search for all users (general search)
   */
  searchAllUsers(query: string, limit: number = 10): Observable<any[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('limit', limit.toString());

    return this.http.get<BackendResponse<any>>(`${environment.apiUrl}/users`, { params })
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to search users');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error searching users:', error);
          return throwError(() => new Error('Failed to search users'));
        })
      );
  }

  /**
   * Get pending invitations for a group
   */
  getPendingInvitations(groupId: string): Observable<any[]> {
    return this.http.get<BackendResponse<any>>(`${this.apiUrl}/${groupId}/invitations`)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Failed to fetch invitations');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error fetching invitations:', error);
          return throwError(() => new Error('Failed to load invitations'));
        })
      );
  }

  /**
   * Cancel a pending invitation
   */
  cancelInvitation(groupId: string, invitationId: string): Observable<void> {
    return this.http.delete<BackendResponse<void>>(`${this.apiUrl}/${groupId}/invitations/${invitationId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to cancel invitation');
          }
        }),
        catchError(error => {
          console.error('Error canceling invitation:', error);
          return throwError(() => new Error('Failed to cancel invitation'));
        })
      );
  }

  /**
   * Resend an invitation
   */
  resendInvitation(groupId: string, invitationId: string): Observable<void> {
    return this.http.post<BackendResponse<void>>(`${this.apiUrl}/${groupId}/invitations/${invitationId}/resend`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to resend invitation');
          }
        }),
        catchError(error => {
          console.error('Error resending invitation:', error);
          return throwError(() => new Error('Failed to resend invitation'));
        })
      );
  }

  /**
   * Bulk operations
   */
  bulkUpdateRoles(groupId: string, updates: Array<{memberId: string, role: 'admin' | 'member' | 'viewer'}>): Observable<GroupMember[]> {
    const payload = { updates };

    return this.http.put<BackendResponse<BackendMember>>(`${this.apiUrl}/${groupId}/members/bulk`, payload)
      .pipe(
        map(response => {
          if (!response.success || !response.members) {
            throw new Error(response.message || 'Failed to update member roles');
          }
          return response.members.map(member => this.transformMember(member));
        }),
        catchError(error => {
          console.error('Error bulk updating roles:', error);
          return throwError(() => new Error('Failed to update member roles'));
        })
      );
  }

  /**
   * Remove multiple members
   */
  bulkRemoveMembers(groupId: string, memberIds: string[]): Observable<void> {
    const payload = { member_ids: memberIds };

    return this.http.delete<BackendResponse<void>>(`${this.apiUrl}/${groupId}/members/bulk`, { body: payload })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to remove members');
          }
        }),
        catchError(error => {
          console.error('Error bulk removing members:', error);
          return throwError(() => new Error('Failed to remove members'));
        })
      );
  }
} 