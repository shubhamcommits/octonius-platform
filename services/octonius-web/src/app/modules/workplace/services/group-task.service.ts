import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Task interfaces
export interface Task {
  uuid: string;
  group_id: string;
  column_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
  position: number;
  due_date: Date | null;
  start_date: Date | null;
  completed_at: Date | null;
  completed_by: string | null;
  created_by: string;
  assigned_to: string | null;
  labels: Array<{
    text: string;
    color: string;
  }>;
  attachments: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  metadata: {
    estimated_hours?: number;
    actual_hours?: number;
    custom_fields?: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
  creator?: {
    uuid: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  assignee?: {
    uuid: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface TaskColumn {
  uuid: string;
  group_id: string;
  name: string;
  position: number;
  color: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface Board {
  columns: Array<{
    id: string;
    name: string;
    color: string;
    tasks: Task[];
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GroupTaskService {
  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) { }

  /**
   * Get the task board for a group
   * @param groupId The group UUID
   * @returns Observable of the board with columns and tasks
   */
  getBoard(groupId: string): Observable<Board> {
    return this.http.get<ApiResponse<Board>>(`${this.apiUrl}/${groupId}/tasks/board`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching board:', error);
          return throwError(() => new Error('Failed to load task board'));
        })
      );
  }

  /**
   * Create a new task
   * @param groupId The group UUID
   * @param taskData The task data
   * @returns Observable of the created task
   */
  createTask(groupId: string, taskData: {
    title: string;
    description?: string;
    column_id: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    color?: string;
    due_date?: Date;
    start_date?: Date;
    assigned_to?: string;
    labels?: Array<{ text: string; color: string }>;
    metadata?: any;
  }): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}/${groupId}/tasks`, taskData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error creating task:', error);
          return throwError(() => new Error('Failed to create task'));
        })
      );
  }

  /**
   * Get a specific task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @returns Observable of the task
   */
  getTask(groupId: string, taskId: string): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${groupId}/tasks/${taskId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching task:', error);
          return throwError(() => new Error('Failed to load task'));
        })
      );
  }

  /**
   * Update a task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @param updateData The data to update
   * @returns Observable of the updated task
   */
  updateTask(groupId: string, taskId: string, updateData: Partial<{
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    color: string;
    due_date: Date | null;
    start_date: Date | null;
    assigned_to: string | null;
    labels: Array<{ text: string; color: string }>;
    metadata: any;
  }>): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${groupId}/tasks/${taskId}`, updateData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error updating task:', error);
          return throwError(() => new Error('Failed to update task'));
        })
      );
  }

  /**
   * Move a task to a different column or position
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @param moveData The column and position to move to
   * @returns Observable of the moved task
   */
  moveTask(groupId: string, taskId: string, moveData: {
    column_id: string;
    position: number;
  }): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}/${groupId}/tasks/${taskId}/move`, moveData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error moving task:', error);
          return throwError(() => new Error('Failed to move task'));
        })
      );
  }

  /**
   * Delete a task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @returns Observable of void
   */
  deleteTask(groupId: string, taskId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${groupId}/tasks/${taskId}`)
      .pipe(
        map(() => undefined),
        catchError(error => {
          console.error('Error deleting task:', error);
          return throwError(() => new Error('Failed to delete task'));
        })
      );
  }

  /**
   * Create a new column
   * @param groupId The group UUID
   * @param columnData The column data
   * @returns Observable of the created column
   */
  createColumn(groupId: string, columnData: {
    name: string;
    color?: string;
    position?: number;
  }): Observable<TaskColumn> {
    return this.http.post<ApiResponse<TaskColumn>>(`${this.apiUrl}/${groupId}/tasks/columns`, columnData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error creating column:', error);
          return throwError(() => new Error('Failed to create column'));
        })
      );
  }

  /**
   * Update a column
   * @param groupId The group UUID
   * @param columnId The column UUID
   * @param updateData The data to update
   * @returns Observable of the updated column
   */
  updateColumn(groupId: string, columnId: string, updateData: Partial<{
    name: string;
    color: string;
    position: number;
  }>): Observable<TaskColumn> {
    return this.http.put<ApiResponse<TaskColumn>>(`${this.apiUrl}/${groupId}/tasks/columns/${columnId}`, updateData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error updating column:', error);
          return throwError(() => new Error('Failed to update column'));
        })
      );
  }

  /**
   * Delete a column
   * @param groupId The group UUID
   * @param columnId The column UUID
   * @returns Observable of void
   */
  deleteColumn(groupId: string, columnId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${groupId}/tasks/columns/${columnId}`)
      .pipe(
        map(() => undefined),
        catchError(error => {
          console.error('Error deleting column:', error);
          return throwError(() => new Error('Failed to delete column'));
        })
      );
  }

  /**
   * Mark a task as done
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @returns Observable of the updated task
   */
  markTaskAsDone(groupId: string, taskId: string): Observable<Task> {
    return this.updateTask(groupId, taskId, { status: 'done' });
  }

  /**
   * Reopen a completed task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @returns Observable of the updated task
   */
  reopenTask(groupId: string, taskId: string): Observable<Task> {
    return this.updateTask(groupId, taskId, { status: 'todo' });
  }
} 