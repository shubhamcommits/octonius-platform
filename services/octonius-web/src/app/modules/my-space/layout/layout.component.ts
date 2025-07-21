import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { SharedModule } from '../../shared/shared.module'
import { AuthService } from '../../../core/services/auth.service'
import { ThemeService } from '../../../core/services/theme.service'
import { DialogService } from '../../../core/services/dialog.service'
import { filter, map } from 'rxjs/operators'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  breadcrumb: string = 'inbox';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService,
    private dialogService: DialogService
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

  ngOnInit(): void {
    // Check if we should show onboarding dialog
    this.checkOnboarding();
  }

  /**
   * Check if onboarding dialog should be shown
   */
  private checkOnboarding(): void {
    const showOnboarding = localStorage.getItem('showOnboarding');
    if (showOnboarding === 'true') {
      // Show onboarding dialog after a short delay
      setTimeout(() => {
        this.showOnboardingDialog();
      }, 1000); // 1 second delay
    }
  }

  /**
   * Show the onboarding dialog
   */
  private showOnboardingDialog(): void {
    // Create and show the onboarding dialog
    const dialogRef = this.dialogService.confirm({
      title: 'Welcome to Your New Workplace! 🎉',
      message: 'Your workplace has been successfully created and you\'re all set up as the owner. To get the most out of your experience, we recommend completing your profile first.',
      confirmText: 'Complete Profile',
      cancelText: 'Skip for Now',
      type: 'info',
      icon: 'Info'
    });

    dialogRef.subscribe(confirmed => {
      if (confirmed) {
        // Navigate to profile page
        this.router.navigate(['/account/profile']);
      }
      // Clear the onboarding flag
      localStorage.removeItem('showOnboarding');
    });
  }

  /**
   * Logs out the user and navigates to login page
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/auths/login']);
  }
} 