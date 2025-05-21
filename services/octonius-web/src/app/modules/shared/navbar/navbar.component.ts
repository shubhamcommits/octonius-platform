import { Component } from '@angular/core'
import { SharedModule } from '../shared.module'

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  /**
   * Tracks the currently selected theme
   */
  currentTheme = 'light'

  constructor() {
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
      return '/logo/octonius-logo-white.svg'
    }
    // Default to blue logo for light and other themes
    return '/logo/octonius-logo-blue.svg'
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
}
