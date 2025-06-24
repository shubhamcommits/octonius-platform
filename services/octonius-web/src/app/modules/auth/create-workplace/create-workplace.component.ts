import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../../core/services/auth.service'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { FormsModule } from '@angular/forms'
import { WorkplaceService } from '../../shared/services/workplace.service'

@Component({
  selector: 'app-create-workplace',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './create-workplace.component.html',
  styleUrls: ['./create-workplace.component.scss']
})
export class CreateWorkplaceComponent implements OnInit {
  createWorkplaceForm!: FormGroup
  otpForm!: FormGroup
  step: 'create' | 'verify' = 'create'
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private workplaceService: WorkplaceService
  ) {
    // Try to get email from router state
    const nav = this.router.getCurrentNavigation()
    const email = nav?.extras.state?.['email']
    const is_new_user = nav?.extras.state?.['is_new_user']
    const user = nav?.extras.state?.['user']

    // If email is not present, redirect to login
    if (!email) {
      this.router.navigate(['/auths/login'])
    }

    this.email = email
    this.is_new_user = is_new_user
    this.user = user

    this.createWorkplaceForm = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      workplace_name: ['', [Validators.required, Validators.minLength(3)]]
    })

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    })
  }

  ngOnInit() {
    this.startResendTimer()
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }

  startResendTimer() {
    this.canResendOtp = false
    this.resendTimer = 30
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--
      } else {
        this.canResendOtp = true
        clearInterval(this.timerInterval)
      }
    }, 1000)
  }

  onResendOtp() {
    if (!this.canResendOtp || this.isLoading) return
    this.isLoading = true
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.startResendTimer()
          this.otpError = ''
        },
        error: (err: any) => {
          this.otpError = 'Failed to resend OTP. Try again.'
        }
      })
  }

  onSubmitForm() {
    if (this.createWorkplaceForm.invalid) {
      this.createWorkplaceForm.markAllAsTouched()
      return
    }
    this.isLoading = true
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.step = 'verify'
          this.otpError = ''
          this.startResendTimer()
        },
        error: (err: any) => {
          this.otpError = 'Failed to send OTP. Try again.'
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
            this.createWorkplace()
          } else {
            this.otpError = 'Invalid OTP. Try again.'
          }
        },
        error: () => {
          this.otpError = 'Invalid OTP. Try again.'
        }
      })
  }

  createWorkplace() {
    const workplace_name = this.createWorkplaceForm.get('workplace_name')?.value
    this.isLoading = true
    this.authService.setupWorkplace(this.email, workplace_name)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (workplace) => {
          this.router.navigate(['/myspace'])
        },
        error: (error) => {
          if (error?.error?.message === 'A workplace with this name already exists' || error?.error?.message === 'AUTH_WORKPLACE_NAME_EXISTS' || error?.error?.message?.includes('already exists')) {
            this.otpError = error?.error?.message || 'A workplace with this name already exists.'
            this.showWorkplaceNameEdit = true;
            this.attemptedWorkplaceName = workplace_name;
          } else {
            this.otpError = error?.error?.message || 'Failed to create workplace'
          }
        }
      })
  }

  onEditWorkplaceNameSubmit(newName: string) {
    if (!newName || newName.length < 3) {
      this.otpError = 'Workplace name is required (min 3 chars).';
      return;
    }
    this.createWorkplaceForm.get('workplace_name')?.setValue(newName);
    this.showWorkplaceNameEdit = false;
    this.otpError = '';
    this.onResendOtpForNewName(newName);
  }

  onResendOtpForNewName(newName: string) {
    this.isLoading = true;
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.otpError = '';
          this.otpForm.reset();
          this.startResendTimer();
        },
        error: () => {
          this.otpError = 'Failed to resend OTP. Try again.';
        }
      });
  }
}
