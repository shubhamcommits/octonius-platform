import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredPermission = route.data['permission'];
    
    if (!requiredPermission) {
      return true; // No permission required
    }

    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.toastService.error('Not authenticated');
      this.router.navigate(['/auths/login']);
      return false;
    }

    if (!user.current_workplace_id) {
      this.toastService.error('No workplace selected');
      this.router.navigate(['/auths/select-workplace']);
      return false;
    }

    // Get user's role and check permissions
    return this.checkUserPermission(user.uuid, user.current_workplace_id, requiredPermission).pipe(
      catchError(error => {
        console.error('Permission check failed:', error);
        this.toastService.error('Permission check failed');
        return of(false);
      })
    );
  }

  private checkUserPermission(userId: string, workplaceId: string, permission: string): Observable<boolean> {
    // This would ideally call a backend endpoint to check permissions
    // For now, we'll implement a basic check
    return of(true); // TODO: Implement actual permission check
  }
} 