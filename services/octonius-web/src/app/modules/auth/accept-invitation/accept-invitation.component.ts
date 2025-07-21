import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkplaceSettingsService } from '../../../core/services/workplace-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SharedModule } from '../../shared/shared.module';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  templateUrl: './accept-invitation.component.html',
  styleUrls: ['./accept-invitation.component.scss']
})
export class AcceptInvitationComponent implements OnInit {
  token: string | null = null;
  email: string = '';
  isLoading = false;
  isVerifying = true;
  error: string | null = null;
  invitationData: any = null;
  acceptForm: FormGroup;
  
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private workplaceSettingsService: WorkplaceSettingsService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.acceptForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    console.log('AcceptInvitationComponent initialized');
    
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      console.log('Query params:', params);
      this.token = params['token'];
      
      if (!this.token) {
        console.error('No token in query params');
        this.error = 'Invalid invitation link';
        this.isVerifying = false;
        return;
      }
      
      // Verify invitation token first
      this.verifyInvitation();
    });
  }

  private verifyInvitation(): void {
    if (!this.token) {
      console.error('No token provided for verification');
      this.error = 'No invitation token provided';
      this.isVerifying = false;
      return;
    }

    console.log('Verifying invitation with token:', this.token);
    
    this.workplaceSettingsService.verifyInvitation(this.token)
      .pipe(
        timeout(10000) // 10 second timeout
      )
      .subscribe({
        next: (response) => {
          console.log('Verification response:', response);
          
          if (response.success && response.workplace?.invitation) {
            this.invitationData = response.workplace.invitation;
            this.email = this.invitationData.email;
            
            console.log('Invitation data:', this.invitationData);
            
            // Set the email in the form and disable it
            this.acceptForm.patchValue({ email: this.email });
            this.acceptForm.get('email')?.disable();
            
            this.isVerifying = false;
          } else {
            console.error('Invalid response structure:', response);
            this.error = response.message || 'Invalid invitation';
            this.isVerifying = false;
          }
        },
        error: (error) => {
          console.error('Error verifying invitation:', error);
          this.error = error.error?.message || error.message || 'Invalid or expired invitation';
          this.isVerifying = false;
        }
      });
  }

  onSubmit(): void {
    // Check if we have a token and email
    if (!this.token) {
      console.error('No token available');
      return;
    }
    
    // Get the email - either from disabled field or form value
    const emailToUse = this.acceptForm.get('email')?.disabled 
      ? this.email 
      : this.acceptForm.get('email')?.value;
    
    if (!emailToUse) {
      console.error('No email available');
      return;
    }
    
    console.log('Accepting invitation with:', { token: this.token, email: emailToUse });
    
    this.isLoading = true;
    this.error = null;
    
    this.workplaceSettingsService.acceptInvitation(this.token, emailToUse)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Accept invitation response:', response);
          
          if (response.success) {
            const data = response.data;
            console.log('Response data:', data);
            
            // If user needs onboarding (no first/last name)
            if (data.needs_onboarding) {
              console.log('User needs onboarding, setting tokens and navigating to profile');
              
              // Set tokens and user data first
              if (data.access_token && data.refresh_token) {
                console.log('Setting tokens');
                this.authService.setTokens(data.access_token, data.refresh_token);
              }
              if (data.user) {
                console.log('Setting user data:', data.user);
                this.authService.setCurrentUser(data.user);
              }
              
              // Store onboarding flag for new users
              localStorage.setItem('showOnboarding', 'true');
              
              this.toastService.info('Please complete your profile to continue');
              // Navigate to profile page instead of welcome
              console.log('Navigating to /account/profile');
              this.router.navigate(['/account/profile']).then(
                success => console.log('Navigation success:', success),
                error => console.error('Navigation failed:', error)
              );
            } else {
              // Check if we have auth tokens in the response
              if (data.access_token && data.refresh_token) {
                console.log('New user login, setting tokens');
                // New user or logged out user - set tokens
                this.authService.setTokens(data.access_token, data.refresh_token);
                // Set the user data
                if (data.user) {
                  this.authService.setCurrentUser(data.user);
                }
                this.toastService.success(`🎉 Welcome to ${data.workplace.name}! You've successfully joined the workplace.`);
                console.log('Navigating to /myspace');
                this.router.navigate(['/myspace']).then(
                  (success: boolean) => console.log('Navigation success:', success),
                  (error: any) => console.error('Navigation failed:', error)
                );
              } else if (this.authService.getCurrentUser()) {
                // Existing logged in user
                const currentUser = this.authService.getCurrentUser();
                if (currentUser) {
                  currentUser.current_workplace_id = data.workplace.uuid;
                  this.authService.setCurrentUser(currentUser);
                }
                this.toastService.success('Successfully joined the workplace!');
                // Navigate to myspace instead of workplace
                this.router.navigate(['/myspace']);
              } else {
                // No tokens and no current user - redirect to login
                this.toastService.success('Invitation accepted! Please login to continue.');
                this.router.navigate(['/auths/login']);
              }
            }
          } else {
            this.error = response.message || 'Failed to accept invitation';
            this.toastService.error(this.error);
          }
        },
        error: (error) => {
          console.error('Error accepting invitation:', error);
          this.error = error.error?.message || 'Failed to accept invitation. Please try again.';
          if (this.error) {
            this.toastService.error(this.error);
          }
        }
      });
  }
} 