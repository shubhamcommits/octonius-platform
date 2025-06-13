import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'

@Component({
  selector: 'app-create-workplace',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-workplace.component.html',
  styleUrls: ['./create-workplace.component.scss']
})
export class CreateWorkplaceComponent {
  createWorkplaceForm!: FormGroup
  isLoading = false
  email: string = ''

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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

    this.createWorkplaceForm = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      workplace_name: ['', [Validators.required, Validators.minLength(3)]]
    })
  }

  onSubmit() {
    if (this.createWorkplaceForm.valid) {
      this.isLoading = true
      const workplace_name = this.createWorkplaceForm.get('workplace_name')?.value
      this.authService.setupWorkplace(this.email, workplace_name)
        .pipe(
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (workplace) => {
            this.router.navigate(['/dashboard'])
          },
          error: (error) => {
            console.error('Error creating workplace:', error)
            // TODO: Handle error appropriately
          }
        })
    }
  }
}
