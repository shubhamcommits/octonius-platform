import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// Functional interceptor for Angular 17+
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Skip interceptor for logout requests to prevent infinite loops
    if (req.url.includes('/auths/logout')) {
        return next(req);
    }
    
    // Get the auth token from the service
    const authToken = authService.getAccessToken();
    
    console.log('Auth Interceptor - Token:', authToken ? 'Present' : 'Missing');
    console.log('Auth Interceptor - URL:', req.url);
    
    // Clone the request and add the authorization header if token exists
    if (authToken) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${authToken}`
            }
        });
        console.log('Auth Interceptor - Added Authorization header');
    }
    
    // Handle the request
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                console.log('Auth Interceptor - 401 Unauthorized, logging out');
                // Clear local storage and redirect without making logout API call
                // Only if not already logging out
                if (!authService['isLoggingOut']) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    authService.clearCurrentUser();
                    router.navigate(['/auths/login']);
                }
            }
            return throwError(() => error);
        })
    );
};

// Class-based interceptor (kept for backwards compatibility)
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip interceptor for logout requests to prevent infinite loops
        if (req.url.includes('/auths/logout')) {
            return next.handle(req);
        }
        
        // Get the auth token from the service
        const authToken = this.authService.getAccessToken()

        // Clone the request and add the authorization header if token exists
        if (authToken) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${authToken}`
                }
            })
        }

        // Handle the request
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    // Clear local storage and redirect without making logout API call
                    // Only if not already logging out
                    if (!this.authService['isLoggingOut']) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        this.authService.clearCurrentUser();
                        this.router.navigate(['/auths/login']);
                    }
                }
                return throwError(() => error)
            })
        )
    }
} 