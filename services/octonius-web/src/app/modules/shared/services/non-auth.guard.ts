import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const isValid = this.authService.isTokenValid();
    
    if (!isValid) {
      return true;
    }

    // Check if user has a workplace
    const user = this.authService.getCurrentUser();
    
    if (user && !user.current_workplace_id) {
      // Allow authenticated users without workplace to access auth routes
      return true;
    }

    // If user is authenticated and has a workplace, redirect to my-space
    return this.router.createUrlTree(['/myspace']);
  }
} 