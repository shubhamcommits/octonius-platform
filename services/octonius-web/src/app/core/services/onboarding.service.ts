import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { AuthService, User } from './auth.service';
import { Router } from '@angular/router';

export interface ProfileCheckResult {
  isComplete: boolean;
  missingFields: string[];
  needsOnboarding: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private profileCheckSubject = new BehaviorSubject<ProfileCheckResult | null>(null);
  public profileCheck$ = this.profileCheckSubject.asObservable();
  
  private onboardingShown = false;
  private checkInterval = 30000; // Check every 30 seconds
  private timer$ = timer(0, this.checkInterval);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeProfileChecking();
  }

  private initializeProfileChecking(): void {
    this.timer$
      .pipe(
        switchMap(() => this.checkUserProfile()),
        distinctUntilChanged((prev, curr) => 
          prev?.isComplete === curr?.isComplete && 
          prev?.needsOnboarding === curr?.needsOnboarding
        ),
        filter(result => result !== null)
      )
      .subscribe(result => {
        this.profileCheckSubject.next(result);
        
        // Show onboarding if needed and not already shown
        if (result?.needsOnboarding && !this.onboardingShown) {
          this.showOnboardingDialog();
        }
      });
  }

  private checkUserProfile(): Observable<ProfileCheckResult> {
    return new Observable(observer => {
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        observer.next({
          isComplete: true,
          missingFields: [],
          needsOnboarding: false
        });
        observer.complete();
        return;
      }

      const missingFields: string[] = [];
      let needsOnboarding = false;

      // Check for required profile fields
      if (!currentUser.first_name || currentUser.first_name.trim() === '') {
        missingFields.push('first_name');
        needsOnboarding = true;
      }

      if (!currentUser.last_name || currentUser.last_name.trim() === '') {
        missingFields.push('last_name');
        needsOnboarding = true;
      }

      // Check for optional but recommended fields
      if (!currentUser.job_title || currentUser.job_title.trim() === '') {
        missingFields.push('job_title');
      }

      if (!currentUser.department || currentUser.department.trim() === '') {
        missingFields.push('department');
      }

      const result: ProfileCheckResult = {
        isComplete: missingFields.length === 0,
        missingFields,
        needsOnboarding
      };

      observer.next(result);
      observer.complete();
    });
  }

  private showOnboardingDialog(): void {
    // Set flag to prevent multiple dialogs
    this.onboardingShown = true;
    
    // Set localStorage flag for the onboarding dialog component
    localStorage.setItem('showOnboarding', 'true');
    
    // Navigate to a route that will trigger the onboarding dialog
    // We'll use the existing logic in the app component or layout
    this.router.navigate(['/myspace']);
  }

  // Reset onboarding shown flag (call when user completes profile)
  resetOnboardingFlag(): void {
    this.onboardingShown = false;
    localStorage.removeItem('showOnboarding');
  }

  // Manual check method
  checkProfileNow(): Observable<ProfileCheckResult> {
    return this.checkUserProfile();
  }

  // Get current profile status
  getCurrentProfileStatus(): ProfileCheckResult | null {
    return this.profileCheckSubject.value;
  }

  // Check if user needs onboarding (missing name)
  needsOnboarding(): boolean {
    const status = this.getCurrentProfileStatus();
    return status?.needsOnboarding || false;
  }

  // Check if profile is complete
  isProfileComplete(): boolean {
    const status = this.getCurrentProfileStatus();
    return status?.isComplete || false;
  }

  // Get missing fields
  getMissingFields(): string[] {
    const status = this.getCurrentProfileStatus();
    return status?.missingFields || [];
  }

  // Force a profile check
  forceProfileCheck(): void {
    this.checkUserProfile().subscribe(result => {
      this.profileCheckSubject.next(result);
    });
  }
} 