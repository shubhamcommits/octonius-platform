import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const isValid = this.authService.isTokenValid();
    
    if (isValid) {
      return true;
    }

    // Return UrlTree to prevent navigation conflicts
    return this.router.createUrlTree(['/auths/login']);
  }
} 