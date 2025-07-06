import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Task Comment interfaces
export interface TaskComment {
  uuid: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    uuid: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface TaskCommentCreateData {
  content: string;
}

export interface TaskCommentUpdateData {
  content: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  comments?: T;
  message: string;
  meta?: {
    responseTime: string;
  };
}

interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  comments?: T[];
  message: string;
  meta?: {
    responseTime: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaskCommentService {
  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  /**
   * Get all comments for a specific task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @returns Observable of comments array
   */
  getTaskComments(groupId: string, taskId: string): Observable<TaskComment[]> {
    return this.http.get<ApiListResponse<TaskComment>>(`${this.apiUrl}/${groupId}/tasks/${taskId}/comments`)
      .pipe(
        map(response => response.comments || response.data || []),
        catchError(error => {
          console.error('Error fetching task comments:', error);
          return throwError(() => new Error('Failed to load task comments'));
        })
      );
  }

  /**
   * Create a new comment for a task
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @param commentData The comment data
   * @returns Observable of the created comment
   */
  createTaskComment(groupId: string, taskId: string, commentData: TaskCommentCreateData): Observable<TaskComment> {
    return this.http.post<ApiResponse<TaskComment>>(`${this.apiUrl}/${groupId}/tasks/${taskId}/comments`, commentData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error creating task comment:', error);
          return throwError(() => new Error('Failed to create comment'));
        })
      );
  }

  /**
   * Update an existing task comment
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @param commentId The comment UUID
   * @param updateData The update data
   * @returns Observable of the updated comment
   */
  updateTaskComment(groupId: string, taskId: string, commentId: string, updateData: TaskCommentUpdateData): Observable<TaskComment> {
    return this.http.put<ApiResponse<TaskComment>>(`${this.apiUrl}/${groupId}/tasks/${taskId}/comments/${commentId}`, updateData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error updating task comment:', error);
          return throwError(() => new Error('Failed to update comment'));
        })
      );
  }

  /**
   * Delete a task comment
   * @param groupId The group UUID
   * @param taskId The task UUID
   * @param commentId The comment UUID
   * @returns Observable of success response
   */
  deleteTaskComment(groupId: string, taskId: string, commentId: string): Observable<void> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${groupId}/tasks/${taskId}/comments/${commentId}`)
      .pipe(
        map(() => void 0),
        catchError(error => {
          console.error('Error deleting task comment:', error);
          return throwError(() => new Error('Failed to delete comment'));
        })
      );
  }
} 