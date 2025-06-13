import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '../../shared/services/auth.service'
import { CommonModule } from '@angular/common'
import { Component, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { interval, Subscription } from 'rxjs'
import { take } from 'rxjs/operators'

@Component({
    selector: 'app-verify-otp',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './verify-otp.component.html',
    styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnDestroy {

    verifyOtpForm: FormGroup
    isLoading = false
    email: string = ''
    
    // Timer properties
    canResendOtp = false
    resendTimer = 0
    timerSubscription: Subscription | null = null
    otpSent = false
    
    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        // Try to get email from router state
        const nav = this.router.getCurrentNavigation()
        this.email = nav?.extras.state?.['email'] || ''

        this.verifyOtpForm = this.fb.group({
            email: [this.email, [Validators.required, Validators.email]],
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
        })

        // If email is not present, redirect to login
        if (!this.email) {
            this.router.navigate(['/auths/login'])
        }
    }
    
    ngOnInit() {
        // Start the timer when component loads
        this.startResendTimer()
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
    
    onResendOtp(): void {
        if (this.canResendOtp && !this.isLoading) {
            this.isLoading = true
            this.authService.requestOtp(this.email)
                .pipe(finalize(() => this.isLoading = false))
                .subscribe({
                    next: (response) => {
                        this.otpSent = true
                        this.startResendTimer()
                        console.log('OTP resent successfully')
                    },
                    error: (error) => {
                        console.error('Error resending OTP:', error)
                        // TODO: Show error message to user
                    }
                })
        }
    }

    onSubmit() {
        const email = this.verifyOtpForm.get('email')?.value
        const otp = this.verifyOtpForm.get('otp')?.value
        if (this.verifyOtpForm.valid) {
            this.isLoading = true
            this.authService.verifyOtp(email, otp)
            .pipe(
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (response: any) => {
                    if (response.data.exists == true) {
                        this.router.navigate(['/auths/select-workplace'], { state: { email, is_new_user: false, user: response.data.user } })
                    } else {
                        this.router.navigate(['/auths/create-workplace'], { state: { email, is_new_user: true } })
                    }
                },
                error: (error: any) => {
                    console.error('Error fetching user:', error)
                }
            })
        }
    }
} 