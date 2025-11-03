import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`

  constructor(private http: HttpClient) { }

  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/email/${encodeURIComponent(email)}`)
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => response.data.user),
      catchError(error => {
        console.error('Error fetching current user:', error);
        return throwError(() => error)
      })
    ) as Observable<User>
  }

  updateUser(uuid: string, updates: Partial<User>): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/${uuid}`, updates).pipe(
      map(response => response.data.user),
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(() => error)
      })
    ) as Observable<User>
  }

  /**
   * Remove a user from a workplace
   */
  removeUserFromWorkplace(userId: string, workplaceId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${userId}/workplaces/${workplaceId}`
    ).pipe(
      catchError(error => {
        console.error('Error removing user from workplace:', error);
        return throwError(() => error)
      })
    )
  }
} 