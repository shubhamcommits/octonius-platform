import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GroupActivityPost {
  uuid: string;
  group_id: string;
  user_id: string;
  content: string;
  like_count: number;
  comment_count: number;
  liked_by_current_user: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    uuid: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  // UI-specific properties
  showMenu?: boolean;
  showComments?: boolean;
  loadingComments?: boolean;
  comments?: GroupActivityComment[];
  newComment?: string;
  submittingComment?: boolean;
}

export interface GroupActivityComment {
  uuid: string;
  post_id: string;
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

export interface GroupActivityResponse {
  data: GroupActivityPost | GroupActivityPost[];
  message?: string;
  meta?: any;
}

export interface GroupActivityCommentResponse {
  data: GroupActivityComment | GroupActivityComment[];
  message?: string;
  meta?: any;
}

@Injectable({ providedIn: 'root' })
export class GroupActivityService {
  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  list(groupId: string): Observable<GroupActivityPost[]> {
    return this.http.get<GroupActivityResponse>(`${this.apiUrl}/${groupId}/activity`).pipe(
      map(res => (Array.isArray(res.data) ? res.data : [])),
      catchError(err => throwError(() => err))
    );
  }

  get(groupId: string, postId: string): Observable<GroupActivityPost> {
    return this.http.get<GroupActivityResponse>(`${this.apiUrl}/${groupId}/activity/${postId}`).pipe(
      map(res => res.data as GroupActivityPost),
      catchError(err => throwError(() => err))
    );
  }

  create(groupId: string, content: string): Observable<GroupActivityPost> {
    return this.http.post<GroupActivityResponse>(`${this.apiUrl}/${groupId}/activity`, { content }).pipe(
      map(res => res.data as GroupActivityPost),
      catchError(err => throwError(() => err))
    );
  }

  update(groupId: string, postId: string, content: string): Observable<GroupActivityPost> {
    return this.http.put<GroupActivityResponse>(`${this.apiUrl}/${groupId}/activity/${postId}`, { content }).pipe(
      map(res => res.data as GroupActivityPost),
      catchError(err => throwError(() => err))
    );
  }

  delete(groupId: string, postId: string): Observable<void> {
    return this.http.delete<GroupActivityResponse>(`${this.apiUrl}/${groupId}/activity/${postId}`).pipe(
      map(() => void 0),
      catchError(err => throwError(() => err))
    );
  }

  // --- Likes ---
  like(groupId: string, postId: string): Observable<{ success: boolean; liked: boolean; likeCount: number }> {
    return this.http.post<any>(`${this.apiUrl}/${groupId}/activity/${postId}/like`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Unlike a post
   * @param groupId The group UUID
   * @param postId The post UUID
   * @returns Observable with like count
   */
  unlike(groupId: string, postId: string): Observable<{ likeCount: number }> {
    return this.http.delete<{ likeCount: number }>(`${this.apiUrl}/${groupId}/activity/${postId}/like`);
  }

  likeCount(groupId: string, postId: string): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/${groupId}/activity/${postId}/like-count`).pipe(
      map(res => res.likeCount),
      catchError(err => throwError(() => err))
    );
  }

  // Optionally, check if the current user liked the post (if backend supports it)
  // isLiked(groupId: string, postId: string): Observable<boolean> {
  //   // Implement if backend endpoint exists
  // }

  // --- Comments ---
  /**
   * List comments for a post
   * @param groupId The group UUID
   * @param postId The post UUID
   * @returns Observable of comments array
   */
  listComments(groupId: string, postId: string): Observable<GroupActivityComment[]> {
    return this.http.get<GroupActivityCommentResponse>(`${this.apiUrl}/${groupId}/activity/${postId}/comments`)
      .pipe(map(response => Array.isArray(response.data) ? response.data : [response.data]));
  }

  /**
   * Create a new comment on a post
   * @param groupId The group UUID
   * @param postId The post UUID
   * @param content The comment content
   * @returns Observable of the created comment
   */
  createComment(groupId: string, postId: string, content: string): Observable<GroupActivityComment> {
    return this.http.post<GroupActivityCommentResponse>(`${this.apiUrl}/${groupId}/activity/${postId}/comments`, { content })
      .pipe(map(response => Array.isArray(response.data) ? response.data[0] : response.data));
  }

  deleteComment(groupId: string, postId: string, commentId: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${groupId}/activity/${postId}/comments/${commentId}`).pipe(
      map(() => void 0),
      catchError(err => throwError(() => err))
    );
  }

  commentCount(groupId: string, postId: string): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/${groupId}/activity/${postId}/comment-count`).pipe(
      map(res => res.commentCount),
      catchError(err => throwError(() => err))
    );
  }
} 