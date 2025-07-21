import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-onboarding-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div class="text-center">
          <!-- Welcome Icon -->
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
            </svg>
          </div>
          
          <!-- Title -->
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Welcome to Your New Workplace! 🎉
          </h3>
          
          <!-- Message -->
          <div class="text-sm text-gray-600 mb-6 space-y-3">
            <p>
              Your workplace has been successfully created and you're all set up as the owner.
            </p>
            <p>
              To get the most out of your experience, we recommend completing your profile first.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p class="text-sm text-blue-800 font-medium">Next Steps:</p>
              <ul class="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Complete your profile with your name and details</li>
                <li>• Invite team members to your workplace</li>
                <li>• Start creating groups and tasks</li>
              </ul>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              (click)="goToProfile()"
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Complete Profile
            </button>
            <button
              (click)="skipOnboarding()"
              class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Skip for Now
            </button>
          </div>
          
          <!-- Skip Note -->
          <p class="text-xs text-gray-500 mt-4">
            You can always complete your profile later from the settings menu.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OnboardingDialogComponent implements OnInit {
  
  constructor(
    private router: Router,
    private dialogService: DialogService
  ) {}
  
  ngOnInit(): void {
    // Auto-close dialog when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }
  
  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }
  
  private handleOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('fixed')) {
      this.skipOnboarding();
    }
  }
  
  goToProfile(): void {
    // Clear the onboarding flag
    localStorage.removeItem('showOnboarding');
    
    // Navigate to profile page
    this.router.navigate(['/account/profile']);
    
    // Close the dialog
    this.dialogService.close(true);
  }
  
  skipOnboarding(): void {
    // Clear the onboarding flag
    localStorage.removeItem('showOnboarding');
    
    // Close the dialog
    this.dialogService.close(false);
  }
} 