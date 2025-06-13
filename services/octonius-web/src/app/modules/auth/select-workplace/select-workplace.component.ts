import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { finalize } from 'rxjs/operators'
import { WorkplaceService } from '../../shared/services/workplace.service'

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

interface WorkplaceResponse {
  success: boolean
  message: string
  workplaces: Workplace[]
  meta: {
    response_time: string
  }
}

@Component({
  selector: 'app-select-workplace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-workplace.component.html',
  styleUrls: ['./select-workplace.component.scss']
})
export class SelectWorkplaceComponent {
  workplaces: Workplace[] = []
  isLoading = false
  selectedWorkplaceId: string | null = null
  userName: string = ''
  email: string = ''
  is_new_user: boolean = false
  user: any | null = null
  defaultLogoUrl = 'https://media.octonius.com/assets/icon_workmanagement.svg'

  constructor(
    private workplaceService: WorkplaceService,
    private router: Router
  ) {
    // Try to get email from router state
    const nav = this.router.getCurrentNavigation()
    this.email = nav?.extras.state?.['email'] || ''
    this.is_new_user = nav?.extras.state?.['is_new_user'] || false
    this.user = nav?.extras.state?.['user'] || null

    // Set user name from email (temporary, should come from user service)
    if (this.email) {
      this.userName = this.email.split('@')[0]
    } else {
      this.router.navigate(['/auths/login'])
    }

    if (this.is_new_user == false) {
      if (this.user) {
        this.loadWorkplaces()
      } else {
        this.router.navigate(['/auths/login'])
      }
    }
  }

  loadWorkplaces(): void {
    this.isLoading = true
    this.workplaceService.getUserWorkplaces(this.user.uuid)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.workplaces = response.workplaces
          } else {
            console.error('Failed to load workplaces:', response.message)
          }
        },
        error: (error) => {
          console.error('Error loading workplaces:', error)
          // TODO: Handle error appropriately
        }
      })
  }

  onWorkplaceSelect(workplaceId: string): void {
    this.selectedWorkplaceId = workplaceId
  }

  onContinue(): void {
    if (!this.selectedWorkplaceId) return

    // Find the selected workplace object
    const selectedWorkplace = this.workplaces.find(w => w.uuid === this.selectedWorkplaceId)

    if (!selectedWorkplace) return

    // Navigate to workplace-login with the selected workplace
    this.router.navigate(['/auths/workplace-login'], {
      state: {
        email: this.email,
        workplace: selectedWorkplace,
        user: this.user,
        is_new_user: this.is_new_user
      }
    })
  }

  onCreateWorkplace(): void {
    this.router.navigate(['/auths/create-workplace'], {
      state: {
        email: this.email,
        is_new_user: this.is_new_user,
        user: this.user
      }
    })
  }
}
