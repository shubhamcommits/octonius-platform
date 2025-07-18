import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Permission {
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
}

export interface Role {
  uuid: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  workplace_id: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionsByCategory {
  [category: string]: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  // Get all roles for a workplace
  getWorkplaceRoles(workplaceId: string): Observable<{ success: boolean; message: string; roles: Role[] }> {
    return this.http.get<{ success: boolean; message: string; roles: Role[] }>(
      `${this.apiUrl}/${workplaceId}/roles`
    );
  }

  // Create a new role
  createRole(workplaceId: string, roleData: {
    name: string;
    description: string;
    permissions: string[];
  }): Observable<{ success: boolean; message: string; role: Role }> {
    return this.http.post<{ success: boolean; message: string; role: Role }>(
      `${this.apiUrl}/${workplaceId}/roles`,
      roleData
    );
  }

  // Update a role
  updateRole(roleId: string, updates: {
    name?: string;
    description?: string;
    permissions?: string[];
  }): Observable<{ success: boolean; message: string; role: Role }> {
    return this.http.put<{ success: boolean; message: string; role: Role }>(
      `${this.apiUrl}/roles/${roleId}`,
      updates
    );
  }

  // Delete a role
  deleteRole(roleId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/roles/${roleId}`
    );
  }

  // Assign a role to a user
  assignRole(workplaceId: string, userId: string, roleId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${workplaceId}/members/assign-role`,
      { user_id: userId, role_id: roleId }
    );
  }

  // Get all system permissions
  getSystemPermissions(): Observable<{ 
    success: boolean; 
    message: string; 
    permissions: PermissionsByCategory;
    categories: { [key: string]: string };
  }> {
    return this.http.get<{ 
      success: boolean; 
      message: string; 
      permissions: PermissionsByCategory;
      categories: { [key: string]: string };
    }>(`${this.apiUrl}/permissions`);
  }
} 