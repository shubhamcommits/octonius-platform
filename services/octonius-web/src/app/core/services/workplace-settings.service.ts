import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WorkplaceMember {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  joined_at: string;
  is_current_user: boolean;
}

export interface WorkplaceInvitation {
  uuid: string;
  email: string;
  workplace_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  user_id: string | null;
  role_id: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  inviter?: {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  role?: {
    uuid: string;
    name: string;
  };
  user?: {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface WorkplaceData {
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

export interface WorkplaceStats {
  total_users: number;
  total_admins: number;
  total_members: number;
  total_agoras: number;
  total_work_groups: number;
}

export interface WorkplaceSettingsUpdate {
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  timezone?: string;
  logo_url?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WorkplaceSettingsService {
  private apiUrl = `${environment.apiUrl}/workplaces`;

  constructor(private http: HttpClient) {}

  /**
   * Get workplace data by ID
   */
  getWorkplaceById(workplaceId: string): Observable<{ success: boolean; message: string; workplace: WorkplaceData }> {
    return this.http.get<{ success: boolean; message: string; workplace: WorkplaceData }>(`${this.apiUrl}/${workplaceId}`);
  }

  /**
   * Update workplace settings
   */
  updateWorkplaceSettings(workplaceId: string, settings: WorkplaceSettingsUpdate): Observable<{ success: boolean; message: string; workplace: WorkplaceData }> {
    return this.http.put<{ success: boolean; message: string; workplace: WorkplaceData }>(`${this.apiUrl}/${workplaceId}/settings`, settings);
  }

  /**
   * Get workplace statistics
   */
  getWorkplaceStats(workplaceId: string): Observable<{ success: boolean; message: string; stats: WorkplaceStats }> {
    return this.http.get<{ success: boolean; message: string; stats: WorkplaceStats }>(`${this.apiUrl}/${workplaceId}/stats`);
  }

  /**
   * Get workplace members with pagination
   */
  getWorkplaceMembers(workplaceId: string, params?: PaginationParams): Observable<{ success: boolean; message: string; members: PaginatedResponse<WorkplaceMember> }> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset !== undefined) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<{ success: boolean; message: string; members: PaginatedResponse<WorkplaceMember> }>(
      `${this.apiUrl}/${workplaceId}/members`,
      { params: httpParams }
    );
  }

  createInvitation(workplaceId: string, email: string, roleId: string, message?: string): Observable<{ success: boolean; message: string; invitation: WorkplaceInvitation }> {
    return this.http.post<{ success: boolean; message: string; invitation: WorkplaceInvitation }>(
      `${this.apiUrl}/${workplaceId}/invitations`,
      { email, role_id: roleId, message }
    );
  }

  getWorkplaceInvitations(workplaceId: string, params?: PaginationParams & { status?: string }): Observable<{ success: boolean; message: string; invitations: PaginatedResponse<WorkplaceInvitation> }> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset !== undefined) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<{ success: boolean; message: string; invitations: PaginatedResponse<WorkplaceInvitation> }>(
      `${this.apiUrl}/${workplaceId}/invitations`,
      { params: httpParams }
    );
  }

  cancelInvitation(invitationId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/invitations/${invitationId}`
    );
  }

  verifyInvitation(token: string): Observable<{ success: boolean; message: string; workplace: any }> {
    return this.http.get<{ success: boolean; message: string; workplace: any }>(
      `${this.apiUrl}/invitations/verify/${token}`
    );
  }

  acceptInvitation(token: string, email: string): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/invitations/accept`,
      { token, email }
    );
  }
} 