import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MentionUser {
  id: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  displayName: string;
}

export interface UserMentionSuggestion {
  id: string;
  label: string;
  avatar?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserMentionService {
  private apiUrl = `${environment.apiUrl}/users`;
  private currentGroupId: string | null = null;
  private currentWorkplaceId: string | null = null;

  constructor(private http: HttpClient) {}

  setContext(groupId?: string, workplaceId?: string): void {
    console.log('🔍 UserMentionService: Setting context:', { groupId, workplaceId });
    this.currentGroupId = groupId || null;
    this.currentWorkplaceId = workplaceId || null;
    console.log('🔍 UserMentionService: Context set to:', { 
      currentGroupId: this.currentGroupId, 
      currentWorkplaceId: this.currentWorkplaceId 
    });
  }

  private getDefaultUsers(): Observable<MentionUser[]> {
    const params = new HttpParams()
      .set('limit', '10');

    // If we have a "myspace" context, return only the current user
    if (this.currentGroupId === 'myspace') {
      return this.getCurrentUserForMyspace('');
    }

    // If we have a group context, get group members
    if (this.currentGroupId) {
      const url = `${environment.apiUrl}/groups/${this.currentGroupId}/members`;
      console.log('🔍 UserMentionService: Fetching group members from:', url);
      console.log('🔍 Group ID:', this.currentGroupId);
      return this.http.get<any>(url, { params })
        .pipe(
          map(response => {
            console.log('🔍 Group members response:', response);
            return response.members || [];
          })
        );
    }

    // If we have a workplace context, get workplace members
    if (this.currentWorkplaceId) {
      const url = `${environment.apiUrl}/workplaces/${this.currentWorkplaceId}/members`;
      console.log('🔍 UserMentionService: Fetching workplace members from:', url);
      console.log('🔍 Workplace ID:', this.currentWorkplaceId);
      return this.http.get<any>(url, { params })
        .pipe(
          map(response => {
            console.log('🔍 Workplace members response:', response);
            return response.members || [];
          })
        );
    }

    // Fallback to general user search
    console.log('🔍 UserMentionService: Fetching general users from:', this.apiUrl);
    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        map(response => {
          console.log('🔍 General users response:', response);
          return response.data || response.members || [];
        })
      );
  }

  private getCurrentUserForMyspace(query: string): Observable<MentionUser[]> {
    // For "my space", we'll get the current user from the auth service
    // This is a simplified approach - in a real app, you might want to pass the current user data
    console.log('🔍 UserMentionService: Getting current user for myspace with query:', query);
    
    // Get current user from the API
    return this.http.get<any>(`${environment.apiUrl}/users/me`)
      .pipe(
        map(response => {
          console.log('🔍 Current user response:', response);
          const user = response.data || response.user || response;
          
          // Filter by query if provided
          if (query.trim()) {
            const searchTerm = query.toLowerCase();
            const matchesQuery = 
              user.first_name?.toLowerCase().includes(searchTerm) ||
              user.last_name?.toLowerCase().includes(searchTerm) ||
              user.email?.toLowerCase().includes(searchTerm) ||
              user.displayName?.toLowerCase().includes(searchTerm);
            
            if (!matchesQuery) {
              return [];
            }
          }
          
          return [user];
        }),
        catchError(error => {
          console.error('🔍 Error getting current user for myspace:', error);
          return of([]);
        })
      );
  }

  searchUsers(query: string): Observable<MentionUser[]> {
    if (!query.trim()) {
      // Return some default users when query is empty
      return this.getDefaultUsers();
    }

    const params = new HttpParams()
      .set('search', query.trim())
      .set('limit', '10');

    // If we have a "myspace" context, return only the current user
    if (this.currentGroupId === 'myspace') {
      return this.getCurrentUserForMyspace(query);
    }

    // If we have a group context, search within that group
    if (this.currentGroupId) {
      return this.http.get<any>(`${environment.apiUrl}/groups/${this.currentGroupId}/members`, { params })
        .pipe(
          map(response => response.members || [])
        );
    }

    // If we have a workplace context, search within that workplace
    if (this.currentWorkplaceId) {
      return this.http.get<any>(`${environment.apiUrl}/workplaces/${this.currentWorkplaceId}/members`, { params })
        .pipe(
          map(response => response.members || [])
        );
    }

    // Fallback to general user search
    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        map(response => response.data || response.members || [])
      );
  }

  getUserSuggestions(query: string): Observable<UserMentionSuggestion[]> {
    return this.searchUsers(query).pipe(
      map(users => {
        console.log('🔍 Raw users from API:', users);
        return users.map((user: any, index: number) => {
          console.log(`🔍 Raw user object ${index}:`, JSON.stringify(user, null, 2));
          console.log(`🔍 Available user properties ${index}:`, Object.keys(user));
          
          // Handle different response structures - check if user data is nested
          const userData = user.user || user; // Use nested user object if available
          const suggestion = {
            id: userData.uuid || userData.user_id || userData.id,
            label: userData.displayName || 
                   (userData.first_name && userData.last_name ? userData.first_name + ' ' + userData.last_name : null) || 
                   userData.name || 
                   userData.email ||
                   `User ${index + 1}`,
            avatar: userData.avatar_url || userData.avatar,
            email: userData.email
          };
          console.log(`🔍 Mapped suggestion ${index}:`, suggestion);
          return suggestion;
        });
      })
    );
  }

  getUserById(id: string): Observable<MentionUser | null> {
    return this.http.get<{data: MentionUser}>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data || null)
      );
  }
}
