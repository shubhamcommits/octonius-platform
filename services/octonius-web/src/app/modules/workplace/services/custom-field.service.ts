import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GroupCustomFieldDefinition {
  uuid: string;
  group_id: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
  };
  display_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCustomField {
  uuid: string;
  task_id: string;
  field_definition_id?: string;
  field_name: string;
  field_value: string;
  field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  is_group_field: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  fieldDefinition?: GroupCustomFieldDefinition;
}

export interface CreateGroupFieldDefinitionData {
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
  };
  display_order?: number;
}

export interface CreateTaskCustomFieldData {
  field_definition_id?: string;
  field_name: string;
  field_value: string;
  field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  is_group_field: boolean;
  display_order?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    responseTime: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CustomFieldService {
  private apiUrl = `${environment.apiUrl}/custom-fields`;

  constructor(private http: HttpClient) {}

  // Group Custom Field Definitions
  createGroupFieldDefinition(
    groupId: string, 
    fieldData: CreateGroupFieldDefinitionData
  ): Observable<ApiResponse<GroupCustomFieldDefinition>> {
    return this.http.post<ApiResponse<GroupCustomFieldDefinition>>(
      `${this.apiUrl}/groups/${groupId}/custom-field-definitions`,
      fieldData
    );
  }

  getGroupFieldDefinitions(
    groupId: string, 
    includeInactive: boolean = false
  ): Observable<ApiResponse<GroupCustomFieldDefinition[]>> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('include_inactive', 'true');
    }
    return this.http.get<ApiResponse<GroupCustomFieldDefinition[]>>(
      `${this.apiUrl}/groups/${groupId}/custom-field-definitions`,
      { params }
    );
  }

  updateGroupFieldDefinition(
    fieldId: string, 
    fieldData: Partial<CreateGroupFieldDefinitionData>
  ): Observable<ApiResponse<GroupCustomFieldDefinition>> {
    return this.http.put<ApiResponse<GroupCustomFieldDefinition>>(
      `${this.apiUrl}/custom-field-definitions/${fieldId}`,
      fieldData
    );
  }

  deleteGroupFieldDefinition(fieldId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/custom-field-definitions/${fieldId}`
    );
  }

  // Task Custom Fields
  upsertTaskCustomField(
    taskId: string, 
    fieldData: CreateTaskCustomFieldData
  ): Observable<ApiResponse<TaskCustomField>> {
    return this.http.post<ApiResponse<TaskCustomField>>(
      `${this.apiUrl}/tasks/${taskId}/custom-fields`,
      fieldData
    );
  }

  getTaskCustomFields(taskId: string): Observable<ApiResponse<TaskCustomField[]>> {
    return this.http.get<ApiResponse<TaskCustomField[]>>(
      `${this.apiUrl}/tasks/${taskId}/custom-fields`
    );
  }

  deleteTaskCustomField(fieldId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/custom-fields/${fieldId}`
    );
  }

  reorderTaskCustomFields(
    taskId: string, 
    fieldOrders: { fieldId: string; display_order: number }[]
  ): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/tasks/${taskId}/custom-fields/reorder`,
      { field_orders: fieldOrders }
    );
  }

  // Group Templates for Task Creation
  getGroupTemplatesForTaskCreation(groupId: string): Observable<ApiResponse<GroupCustomFieldDefinition[]>> {
    return this.http.get<ApiResponse<GroupCustomFieldDefinition[]>>(
      `${this.apiUrl}/groups/${groupId}/custom-field-templates`
    );
  }
}
