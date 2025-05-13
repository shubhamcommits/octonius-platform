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
   * List of all DaisyUI themes for the dropdown
   */
  themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk',
    'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
    'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'
  ]

  /**
   * Controls whether the theme dropdown is open
   */
  dropdownOpen = false

  /**
   * Tracks the currently selected theme
   */
  currentTheme = 'dark'

  /**
   * Toggles the theme dropdown open/close state
   */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen
  }

  /**
   * Sets the DaisyUI theme by updating the data-theme attribute on the <html> element.
   * Updates the currentTheme for highlighting.
   * Does NOT close the dropdown after selection (per user request).
   * @param theme The name of the DaisyUI theme to apply
   */
  setTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme)
    this.currentTheme = theme
  }
}
