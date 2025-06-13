import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'
import { Router } from '@angular/router'
import { environment } from '../../../../environments/environment'
import { finalize } from 'rxjs/operators'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    })
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const email = this.loginForm.get('email')?.value
      this.authService.requestOtp(email)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false
          this.router.navigate(['/auths/verify-otp'], { state: { email, is_new_user: response.data.exists } });
        },
        error: (error: any) => {
          this.isLoading = false
          console.error('Error fetching user:', error)
        }
      })
    }
  }
}
