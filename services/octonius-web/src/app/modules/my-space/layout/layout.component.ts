import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { SharedModule } from '../../shared/shared.module'
import { AuthService } from '../../../core/services/auth.service'
import { ThemeService } from '../../../core/services/theme.service'
import { filter, map } from 'rxjs/operators'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  breadcrumb: string = 'inbox';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
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
        return child?.snapshot.url[0]?.path.split('?')[0] || 'inbox';
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