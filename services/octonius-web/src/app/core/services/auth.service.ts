import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  current_workplace_id?: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auths`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private isLoggingOut = false;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Validate that the user object has required fields
        if (user && user.uuid && user.email) {
          return user;
        }
        // If invalid, clear the corrupted data
        localStorage.removeItem('currentUser');
        return null;
      } catch (e) {
        // If parsing fails, clear the corrupted data
        console.error('Failed to parse user from storage:', e);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  }

  // Auth Flow Methods
  requestOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-otp`, { email });
  }

  login(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  register(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email });
  }

  setupWorkplace(email: string, workplaceName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup-workplace`, { 
      email,
      workplace_name: workplaceName
    });
  }

  // Token Management
  setTokens(access_token: string, refresh_token: string) {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      // Check if token has the correct format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        this.clearAllAuthData();
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      if (!exp) {
        console.error('Token missing expiration');
        this.clearAllAuthData();
        return false;
      }
      
      const isValid = Date.now() < exp * 1000;
      if (!isValid) {
        console.log('Token expired');
        this.clearAllAuthData();
      }
      
      return isValid;
    } catch (e) {
      console.error('Error validating token:', e);
      this.clearAllAuthData();
      return false;
    }
  }

  // User Management
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  clearCurrentUser(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<User> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/refresh`, {}).pipe(
      map(response => {
        this.setCurrentUser(response.user);
        return response.user;
      })
    );
  }

  logout(): void {
    // Prevent multiple logout calls
    if (this.isLoggingOut) {
      return;
    }
    
    this.isLoggingOut = true;
    
    // Call backend logout API first
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        // Clear local storage and state
        this.clearAuthData();
      },
      error: (error) => {
        console.error('Logout failed:', error);
        // Even if the API call fails, we should still clear local storage and redirect
        this.clearAuthData();
      }
    });
  }

  // Helper method to clear auth data
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.clearCurrentUser();
    this.isLoggingOut = false;
    // Navigate to login page
    this.router.navigate(['/auths/login']);
  }

  // Method to clear all auth data (useful for debugging)
  clearAllAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isLoggingOut = false;
  }
} 