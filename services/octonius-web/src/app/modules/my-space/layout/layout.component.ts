import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { NavbarComponent } from '../navbar/navbar.component'
import { SharedModule } from '../../shared/shared.module'
import { AuthService } from '../../../core/services/auth.service'
import { LucideAngularModule, Sun, Moon, LogOut } from 'lucide-angular'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SharedModule, LucideAngularModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {

  /**
     * Tracks the currently selected theme
     */
  currentTheme = 'light'

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', this.currentTheme);
    }
  }

  /**
   * Returns the correct logo path based on the current theme
   */
  get logoSrc(): string {
    if (this.currentTheme === 'night') {
      return 'https://media.octonius.com/assets/icon.png' 
    }
    // Default to blue logo for light and other themes
    return 'https://media.octonius.com/assets/icon.png'
  }

  /**
   * Toggles between light and night themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'night' : 'light'
    document.documentElement.setAttribute('data-theme', newTheme)
    this.currentTheme = newTheme
    localStorage.setItem('theme', newTheme)
  }

  /**
   * Logs out the user and navigates to login page
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/auths/login']);
  }
} 