import { Component, OnDestroy } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { AuthService } from '../../../core/services/auth.service'
import { WorkplaceService } from '../../shared/services/workplace.service'
import { finalize } from 'rxjs/operators'
import { interval, Subscription } from 'rxjs'
import { take } from 'rxjs/operators'

interface Workplace {
  uuid: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  size: string | null
  timezone: string
  active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

@Component({
  selector: 'app-workplace-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workplace-login.component.html',
  styleUrls: ['./workplace-login.component.scss']
})
export class WorkplaceLoginComponent implements OnDestroy {
  loginForm: FormGroup
  isLoading = false
  userName: string = ''
  email: string = ''
  selectedWorkplace: Workplace | null = null
  defaultLogoUrl = 'https://media.octonius.com/assets/icon_workmanagement.svg'
  otpSent = false
  user: any | null = null
  is_new_user: boolean = false
  
  // Timer properties
  canResendOtp = false
  resendTimer = 0
  timerSubscription: Subscription | null = null
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private workplaceService: WorkplaceService,
    private router: Router
  ) {
    // Try to get data from router state
    const nav = this.router.getCurrentNavigation()
    this.email = nav?.extras.state?.['email'] || ''
    this.selectedWorkplace = nav?.extras.state?.['workplace'] || null
    this.user = nav?.extras.state?.['user'] || null
    this.is_new_user = nav?.extras.state?.['is_new_user'] || false
    
    // Set user name from email
    if (this.email) {
      this.userName = this.email.split('@')[0]
    } else {
      this.router.navigate(['/auths/login'])
    }
    
    // If no workplace selected, redirect to select-workplace
    if (!this.selectedWorkplace) {
      this.router.navigate(['/auths/select-workplace'], { state: { email: this.email } })
    }
    
    // Initialize form
    this.loginForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    })
  }
  
  ngOnInit() {
    // Automatically request OTP when component loads
    this.requestOtp()
  }
  
  ngOnDestroy() {
    // Clean up timer subscription
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe()
    }
  }
  
  startResendTimer(): void {
    this.canResendOtp = false
    this.resendTimer = 60
    
    // Clear any existing timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe()
    }
    
    // Start countdown timer
    this.timerSubscription = interval(1000)
      .pipe(take(60))
      .subscribe({
        next: () => {
          this.resendTimer--
          if (this.resendTimer <= 0) {
            this.canResendOtp = true
          }
        },
        complete: () => {
          this.canResendOtp = true
          this.resendTimer = 0
        }
      })
  }
  
  requestOtp(): void {
    this.isLoading = true
    this.authService.requestOtp(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.otpSent = true
          this.startResendTimer()
          console.log('OTP sent successfully')
        },
        error: (error) => {
          console.error('Error sending OTP:', error)
          // TODO: Show error message to user
        }
      })
  }
  
  onSubmit(): void {
    if (!this.loginForm.valid || !this.selectedWorkplace) return
    
    this.isLoading = true
    const otp = this.loginForm.get('otp')?.value
    
    // First verify OTP
    this.authService.verifyOtp(this.email, otp)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          // Store tokens if present
          if (response.data && response.data.access_token && response.data.refresh_token) {
            this.authService.setTokens(response.data.access_token, response.data.refresh_token)
          }
          if (response.data.exists) {
            // User exists, now select the workplace
            this.selectWorkplace()
          } else {
            // User doesn't exist, redirect to register
            this.router.navigate(['/auths/create-workplace'], {
              state: {
                email: this.email,
                is_new_user: this.is_new_user,
                user: this.user
              }
            })
          }
        },
        error: (error) => {
          console.error('Error verifying OTP:', error)
          // TODO: Show error message to user
        }
      })
  }
  
  selectWorkplace(): void {
    if (!this.selectedWorkplace || !this.user) return
    
    this.isLoading = true
    this.workplaceService.selectWorkplace(this.selectedWorkplace.uuid, this.user.uuid)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          // Navigate to dashboard after successful workplace selection
          this.router.navigate(['/myspace'])
        },
        error: (error) => {
          console.error('Error selecting workplace:', error)
          // TODO: Handle error appropriately
        }
      })
  }
  
  onResendOtp(): void {
    if (this.canResendOtp && !this.isLoading) {
      this.requestOtp()
    }
  }
  
  onChangeWorkplace(): void {
    this.router.navigate(['/auths/select-workplace'], { 
      state: { 
        email: this.email,
        is_new_user: this.is_new_user,
        user: this.user
      }
    })
  }
}
