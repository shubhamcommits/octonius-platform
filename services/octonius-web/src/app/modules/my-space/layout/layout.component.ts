import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { NavbarComponent } from '../navbar/navbar.component'
import { SharedModule } from '../../shared/shared.module'
import { AuthService } from '../../../core/services/auth.service'
import { ThemeService } from '../../../core/services/theme.service'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SharedModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

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