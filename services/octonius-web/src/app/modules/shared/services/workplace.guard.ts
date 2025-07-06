import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class WorkplaceGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // AuthGuard will have already checked authentication
    // We only need to check if user has a workplace
    const user = this.authService.getCurrentUser();
    
    if (user && user.current_workplace_id) {
      return true;
    }

    // If no workplace, redirect to create workplace
    // Return UrlTree to prevent navigation conflicts
    return this.router.createUrlTree(['/auths/create-workplace'], { 
      queryParams: { 
        email: user?.email,
        returnUrl: this.router.url
      } 
    });
  }
} 