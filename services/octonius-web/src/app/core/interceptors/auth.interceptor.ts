import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

/**
 * Auth Interceptor
 * 
 * Automatically adds Bearer token to API requests, except for:
 * 1. Auth endpoints that don't require authentication
 * 2. S3 URLs (AWS presigned URLs must not have additional headers)
 * 
 * IMPORTANT: S3 presigned URLs are cryptographically signed with specific headers.
 * Adding ANY additional headers (like Authorization) will invalidate the signature
 * and cause AWS to return 400 Bad Request errors.
 */

/**
 * Check if URL is an S3 URL that should not have auth headers
 */
function isS3OrExternalUrl(url: string): boolean {
    const s3Patterns = [
        's3.amazonaws.com',
        's3.eu-central-1.amazonaws.com', 
        's3.us-east-1.amazonaws.com',
        's3.us-west-2.amazonaws.com',
        'amazonaws.com'
    ];
    
    return s3Patterns.some(pattern => url.includes(pattern));
}

// Functional interceptor for Angular 17+
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);
    
    // Skip interceptor for auth endpoints that don't require authentication
    // Note: /auths/logout is NOT in this list because it requires authentication
    const authEndpointsToSkip = ['/auths/login', '/auths/register', '/auths/verify-otp', '/auths/request-otp', '/auths/setup-workplace'];
    if (authEndpointsToSkip.some(endpoint => req.url.includes(endpoint))) {
        return next(req);
    }
    
    // Skip interceptor for S3 URLs (presigned URLs should not have additional headers)
    if (isS3OrExternalUrl(req.url)) {
        console.log('Auth Interceptor - Skipping S3/External URL:', req.url);
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
                // Don't trigger auto-logout if the 401 comes from a logout request
                // to prevent infinite loops
                if (!req.url.includes('/auths/logout') && !authService['isLoggingOut']) {
                    toastService.warning('Your session has expired. Please log in again.');
                    authService.clearAllAuthData();
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
        private router: Router,
        private toastService: ToastService
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip interceptor for auth endpoints that don't require authentication
        // Note: /auths/logout is NOT in this list because it requires authentication
        const authEndpointsToSkip = ['/auths/login', '/auths/register', '/auths/verify-otp', '/auths/request-otp', '/auths/setup-workplace'];
        if (authEndpointsToSkip.some(endpoint => req.url.includes(endpoint))) {
            return next.handle(req);
        }
        
        // Skip interceptor for S3 URLs (presigned URLs should not have additional headers)
        if (isS3OrExternalUrl(req.url)) {
            console.log('Auth Interceptor - Skipping S3/External URL:', req.url);
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
                    // Don't trigger auto-logout if the 401 comes from a logout request
                    // to prevent infinite loops
                    if (!req.url.includes('/auths/logout') && !this.authService['isLoggingOut']) {
                        this.toastService.warning('Your session has expired. Please log in again.');
                        this.authService.clearAllAuthData();
                        this.router.navigate(['/auths/login']);
                    }
                }
                return throwError(() => error)
            })
        )
    }
} 