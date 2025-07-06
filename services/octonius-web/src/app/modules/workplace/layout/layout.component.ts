import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  breadcrumb: string = 'apps';

  constructor(
    private router: Router, 
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.activatedRoute.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        // Get the route segment and remove query parameters
        return child?.snapshot.url[0]?.path.split('?')[0] || 'apps';
      })
    ).subscribe(path => {
      this.breadcrumb = path;
    });
  }

  /**
   * Returns the current theme for template use
   */
  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  /**
   * Returns the correct logo path based on the current theme
   */
  get logoSrc(): string {
    return this.currentTheme === 'night'
      ? 'https://media.octonius.com/assets/icon.png'
      : 'https://media.octonius.com/assets/icon.png'
  }

  /**
   * Toggles between light and night themes
   */
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  /**
   * Logs out the user and navigates to login page
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/auths/login']);
  }
}
