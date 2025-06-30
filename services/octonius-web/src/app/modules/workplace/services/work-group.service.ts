import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Backend response interfaces
interface BackendGroup {
  uuid: string;
  name: string;
  description: string | null;
  image_url: string | null;
  workplace_id: string;
  created_by: string;
  is_active: boolean;
  settings: {
    allow_member_invites: boolean;
    require_approval: boolean;
    visibility: 'public' | 'private';
    default_role: 'member' | 'admin';
  };
  metadata: {
    tags: string[];
    category: string | null;
    department: string | null;
  };
  created_at: string;
  updated_at: string;
  creator?: {
    uuid: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  group_memberships?: Array<{
    uuid: string;
    role: 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
    user: {
      uuid: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  }>;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  code: number;
  groups?: T[];
  group?: T;
}

interface GroupsResponse {
  success: boolean;
  message: string;
  code: number;
  groups: BackendGroup[];
}

interface GroupResponse {
  success: boolean;
  message: string;
  code: number;
  group: BackendGroup;
}

// Frontend interface
export interface WorkGroup {
  uuid: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount: number;
  creator: {
    uuid: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    visibility: 'public' | 'private';
    defaultRole: 'member' | 'admin';
  };
  metadata: {
    tags: string[];
    category: string | null;
    department: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkGroupService {
  private apiUrl = `${environment.apiUrl}/groups`;
  private currentGroup$ = new BehaviorSubject<WorkGroup | null>(null);

  constructor(private http: HttpClient) { }

  /**
   * Transform backend group data to frontend format
   */
  private transformGroup(backendGroup: BackendGroup): WorkGroup {
    const activeMembers = backendGroup.group_memberships?.filter(m => m.status === 'active') || [];
    
    return {
      uuid: backendGroup.uuid,
      name: backendGroup.name,
      description: backendGroup.description,
      imageUrl: backendGroup.image_url || 'https://media.octonius.com/assets/icon_projects.svg',
      memberCount: activeMembers.length,
      creator: {
        uuid: backendGroup.creator?.uuid || 'unknown',
        name: `${backendGroup.creator?.first_name || ''} ${backendGroup.creator?.last_name || ''}`.trim() || 
            backendGroup.creator?.email ||
            'Unknown',
        email: backendGroup.creator?.email || '',
        avatarUrl: backendGroup.creator?.avatar_url || environment.defaultAvatarUrl
      },
      settings: {
        allowMemberInvites: backendGroup.settings.allow_member_invites,
        requireApproval: backendGroup.settings.require_approval,
        visibility: backendGroup.settings.visibility,
        defaultRole: backendGroup.settings.default_role
      },
      metadata: backendGroup.metadata,
      createdAt: backendGroup.created_at,
      updatedAt: backendGroup.updated_at
    };
  }

  /**
   * Get all groups for the current workplace
   */
  getGroups(workplaceId: string): Observable<WorkGroup[]> {
    const params = new HttpParams().set('workplace_id', workplaceId);
    
    return this.http.get<GroupsResponse>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => {
          if (!response.success || !response.groups) {
            throw new Error(response.message || 'Failed to fetch groups');
          }
          return response.groups.map(group => this.transformGroup(group));
        }),
        catchError(error => {
          console.error('Error fetching groups:', error);
          return throwError(() => new Error('Failed to load work groups'));
        })
      );
  }

  /**
   * Get a specific group by ID
   */
  getGroup(id: string): Observable<WorkGroup> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success || !response.group) {
            throw new Error(response.message || 'Failed to fetch group');
          }
          return this.transformGroup(response.group);
        }),
        catchError(error => {
          console.error('Error fetching group:', error);
          return throwError(() => new Error('Failed to load group'));
        })
      );
  }

  /**
   * Create a new group
   */
  createGroup(groupData: {
    name: string;
    description?: string;
    imageUrl?: string;
    workplaceId: string;
    settings?: any;
    metadata?: any;
  }): Observable<WorkGroup> {
    const payload = {
      name: groupData.name,
      description: groupData.description,
      image_url: groupData.imageUrl,
      workplace_id: groupData.workplaceId,
      settings: groupData.settings,
      metadata: groupData.metadata
    };

    return this.http.post<GroupResponse>(`${this.apiUrl}`, payload)
      .pipe(
        map(response => {
          if (!response.success || !response.group) {
            throw new Error(response.message || 'Failed to create group');
          }
          return this.transformGroup(response.group);
        }),
        catchError(error => {
          console.error('Error creating group:', error);
          return throwError(() => new Error('Failed to create group'));
        })
      );
  }

  /**
   * Update a group
   */
  updateGroup(id: string, groupData: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    settings: any;
    metadata: any;
  }>): Observable<WorkGroup> {
    const payload: any = {};
    if (groupData.name !== undefined) payload.name = groupData.name;
    if (groupData.description !== undefined) payload.description = groupData.description;
    if (groupData.imageUrl !== undefined) payload.image_url = groupData.imageUrl;
    if (groupData.settings !== undefined) payload.settings = groupData.settings;
    if (groupData.metadata !== undefined) payload.metadata = groupData.metadata;

    return this.http.put<GroupResponse>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (!response.success || !response.group) {
            throw new Error(response.message || 'Failed to update group');
          }
          return this.transformGroup(response.group);
        }),
        catchError(error => {
          console.error('Error updating group:', error);
          return throwError(() => new Error('Failed to update group'));
        })
      );
  }

  /**
   * Delete a group
   */
  deleteGroup(id: string): Observable<void> {
    return this.http.delete<BackendResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete group');
          }
        }),
        catchError(error => {
          console.error('Error deleting group:', error);
          return throwError(() => new Error('Failed to delete group'));
        })
      );
  }

  /**
   * Search groups by name
   */
  searchGroups(workplaceId: string, searchTerm: string): Observable<WorkGroup[]> {
    const params = new HttpParams()
      .set('workplace_id', workplaceId)
      .set('q', searchTerm);
    
    return this.http.get<GroupsResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response => {
          if (!response.success || !response.groups) {
            throw new Error(response.message || 'Failed to search groups');
          }
          return response.groups.map(group => this.transformGroup(group));
        }),
        catchError(error => {
          console.error('Error searching groups:', error);
          return throwError(() => new Error('Search failed'));
        })
      );
  }

  /**
   * Add a member to a group
   */
  addMember(groupId: string, userId: string, role: 'admin' | 'member' | 'viewer' = 'member'): Observable<any> {
    const payload = {
      user_id: userId,
      role: role
    };

    return this.http.post<BackendResponse<any>>(`${this.apiUrl}/${groupId}/members`, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add member');
          }
          return response;
        }),
        catchError(error => {
          console.error('Error adding member:', error);
          return throwError(() => new Error('Failed to add member'));
        })
      );
  }

  /**
   * Remove a member from a group
   */
  removeMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<BackendResponse<void>>(`${this.apiUrl}/${groupId}/members/${userId}`)
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
   * Set the current group for context sharing
   */
  setCurrentGroup(group: WorkGroup | null) {
    this.currentGroup$.next(group);
  }

  /**
   * Get the current group as observable
   */
  getCurrentGroup(): Observable<WorkGroup | null> {
    return this.currentGroup$.asObservable();
  }
} 