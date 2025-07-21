import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../../core/services/auth.service'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { FormsModule } from '@angular/forms'
import { ToastService } from '../../../core/services/toast.service'

@Component({
  selector: 'app-create-workplace',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './create-workplace.component.html',
  styleUrls: ['./create-workplace.component.scss']
})
export class CreateWorkplaceComponent implements OnInit, OnDestroy {
  createWorkplaceForm!: FormGroup
  otpForm!: FormGroup
  step: 'create' | 'verify' | 'verified' = 'create'
  otpError: string = ''
  isLoading = false
  email: string = ''
  is_new_user: boolean = false
  user: any | null = null
  canResendOtp: boolean = true
  resendTimer: number = 0
  private timerInterval: any
  showWorkplaceNameEdit: boolean = false;
  attemptedWorkplaceName: string = '';
  newWorkplaceName: string = '';
  isOtpVerified: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    // Check if user is authenticated but has no workplace
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.authService.isTokenValid()) {
      // User is authenticated but has no workplace
      this.email = currentUser.email;
      this.is_new_user = true;
      this.user = currentUser;
      this.isOtpVerified = true; // They must have verified OTP to get tokens
    } else {
      // Try to get email from router state (normal flow)
      const nav = this.router.getCurrentNavigation()
      const email = nav?.extras.state?.['email']
      const is_new_user = nav?.extras.state?.['is_new_user']
      const user = nav?.extras.state?.['user']

      // If no email and not authenticated, redirect to login
      if (!email && !currentUser) {
        this.router.navigate(['/auths/login'])
        return;
      }

      this.email = email || '';
      this.is_new_user = is_new_user || false;
      this.user = user || null;
    }

    this.createWorkplaceForm = this.fb.group({
      email: [this.email, [Validators.required, Validators.email]],
      workplace_name: ['', [Validators.required, Validators.minLength(3)]]
    })

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    })
  }

  ngOnInit() {
    // Only start timer if we're in the OTP flow (not already verified)
    if (!this.isOtpVerified) {
      this.startResendTimer()
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }

  startResendTimer() {
    // Clear any existing timer before starting a new one
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    
    this.canResendOtp = false
    this.resendTimer = 30
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--
      } else {
        this.canResendOtp = true
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    }, 1000)
  }

  onResendOtp() {
    if (!this.canResendOtp || this.isLoading) return
    this.isLoading = true
    // Reset OTP field and clear any errors
    this.otpForm.get('otp')?.setValue('')
    this.otpError = ''
    
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.startResendTimer()
          this.otpError = ''
          this.toastService.success('OTP sent successfully')
        },
        error: (err: any) => {
          this.otpError = 'Failed to resend OTP. Try again.'
          this.toastService.error('Failed to send OTP. Please try again.')
        }
      })
  }

  onSubmitForm() {
    if (this.createWorkplaceForm.invalid) {
      this.createWorkplaceForm.markAllAsTouched()
      return
    }
    
    // If OTP is already verified, directly create workplace
    if (this.isOtpVerified) {
      this.createWorkplace()
      return
    }
    
    this.isLoading = true
    // Reset OTP field and clear any errors
    this.otpForm.get('otp')?.setValue('')
    this.otpError = ''
    
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.step = 'verify'
          this.otpError = ''
          this.startResendTimer()
          this.toastService.info('Please check your email for the verification code')
        },
        error: (err: any) => {
          this.otpError = 'Failed to send OTP. Try again.'
          this.toastService.error('Failed to send OTP. Please try again.')
        }
      })
  }

  onVerifyOtp() {
    const otp = this.otpForm.get('otp')?.value
    if (!otp) {
      this.otpError = 'OTP is required.'
      return
    }
    this.isLoading = true
    this.authService.verifyOtp(this.email, otp)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Store tokens if present
            if (res.data && res.data.access_token && res.data.refresh_token) {
              this.authService.setTokens(res.data.access_token, res.data.refresh_token)
            }
            this.otpError = ''
            this.isOtpVerified = true
            this.toastService.success('OTP verified successfully')
            
            // If we have a workplace name ready, create it immediately
            if (this.createWorkplaceForm.get('workplace_name')?.value) {
              this.createWorkplace();
            } else {
              // Otherwise go back to create step
              this.step = 'create'
              // Reset the workplace name edit state
              this.showWorkplaceNameEdit = false
            }
          } else {
            this.otpError = 'Invalid OTP. Try again.'
            this.toastService.error('Invalid OTP. Please try again.')
          }
        },
        error: () => {
          this.otpError = 'Invalid OTP. Try again.'
          this.toastService.error('Invalid OTP. Please try again.')
        }
      })
  }

  createWorkplace() {
    const workplace_name = this.createWorkplaceForm.get('workplace_name')?.value
    this.isLoading = true
    // Show immediate feedback
    this.toastService.info('Creating workplace...');
    this.authService.setupWorkplace(this.email, workplace_name)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          // Store authentication tokens for auto-login
          if (response.data && response.data.access_token && response.data.refresh_token) {
            this.authService.setTokens(response.data.access_token, response.data.refresh_token);
          }
          
          // Update the current user with the new workplace
          if (response.data && response.data.user) {
            this.authService.setCurrentUser(response.data.user);
          }
          
          // Show welcome toast
          this.toastService.success(`🎉 Welcome to ${workplace_name}! Your workplace is ready.`)
          
          // Store onboarding flag for new users
          if (response.data && response.data.user && (!response.data.user.first_name || !response.data.user.last_name)) {
            localStorage.setItem('showOnboarding', 'true');
          }
          
          this.router.navigate(['/myspace'])
        },
        error: (error) => {
          if (error?.status === 409 || error?.error?.message === 'A workplace with this name already exists' || error?.error?.message === 'AUTH_WORKPLACE_NAME_EXISTS' || error?.error?.message?.includes('already exists')) {
            this.otpError = 'This workplace name is already taken. Please choose a different name.'
            this.showWorkplaceNameEdit = true;
            this.attemptedWorkplaceName = workplace_name;
            this.newWorkplaceName = ''; // Clear the new name input
            this.toastService.warning('This workplace name is already taken. Please choose a different name.')
          } else {
            this.otpError = error?.error?.message || 'Failed to create workplace'
            this.toastService.error('Failed to create workplace. Please try again.')
            // Don't reset OTP verified state, user can try again
          }
        }
      })
  }

  onEditWorkplaceNameSubmit(newName: string) {
    if (!newName || newName.length < 3) {
      this.otpError = 'Workplace name is required (min 3 chars).';
      return;
    }
    // Update the form with the new workplace name
    this.createWorkplaceForm.get('workplace_name')?.setValue(newName);
    this.showWorkplaceNameEdit = false;
    this.otpError = '';
    
    // If OTP is already verified, directly create workplace with new name
    if (this.isOtpVerified) {
      this.createWorkplace();
    } else {
      // Otherwise, request OTP and go to verify step
      this.isLoading = true;
      this.authService.requestOtp(this.email)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.step = 'verify';
            this.otpError = '';
            this.otpForm.reset();
            this.startResendTimer();
            this.toastService.info('Please check your email for the verification code');
          },
          error: () => {
            this.otpError = 'Failed to send OTP. Try again.';
            this.toastService.error('Failed to send OTP. Please try again.');
            this.showWorkplaceNameEdit = true; // Show the edit form again
          }
        });
    }
  }
}
