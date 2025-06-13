import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // API URL
  private apiUrl = environment.apiUrl + '/auths'

  // Constructor
  constructor(private http: HttpClient) {}

  // Request otp
  requestOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-otp`, { email })
  }

  // Login
  login(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email })
  }

  // Verify otp
  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp })
  }

  // Register
  register(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email })
  }

  // Setup workplace
  setupWorkplace(email: string, workplaceName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup-workplace`, { 
      email,
      workplace_name: workplaceName
    })
  }
} 