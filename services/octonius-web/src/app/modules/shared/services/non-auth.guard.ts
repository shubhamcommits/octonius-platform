import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isTokenValid()) {
      return true;
    }

    // If user is authenticated, redirect to my-space
    this.router.navigate(['/myspace']);
    return false;
  }
} 