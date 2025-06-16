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
        return JSON.parse(userStr);
      } catch {
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (!exp) return false;
      return Date.now() < exp * 1000;
    } catch (e) {
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.clearCurrentUser();
    this.router.navigate(['/auths/login']);
  }
} 