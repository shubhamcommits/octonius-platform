import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserService } from '../../../core/services/user.service'
import { WorkloadService } from '../../shared/services/workload.service'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'
import { ThemeService } from '../../../core/services/theme.service'
import { Subscription } from 'rxjs'
import { User } from '../../../core/services/auth.service'

interface Task {
  title: string
  dueDate: string
  team: string
  status: 'overdue' | 'todo' | 'in-progress' | 'done'
  priority: 'high' | 'medium' | 'low'
}

@Component({
  selector: 'app-workload',
  standalone: true,
  imports: [CommonModule, CapitalizePipe],
  templateUrl: './workload.component.html',
  styleUrls: ['./workload.component.scss']
})
export class WorkloadComponent implements OnInit, OnDestroy {
  userName = 'User'
  isLoading = false
  error: string | null = null
  workloadStats = {
    total: 0,
    overdue: 0,
    todo: 0,
    inProgress: 0,
    done: 0
  }
  todayTasks: any[] = []
  tomorrowTasks: any[] = []
  nextWeekTasks: any[] = []
  currentTheme = 'light'
  private themeSubscription: Subscription

  constructor(
    private userService: UserService,
    private workloadService: WorkloadService,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme()
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme
    })
  }

  ngOnInit() {
    this.loadData()
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe()
    }
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (user_data: User) => {
        const user = user_data
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        if (user.uuid && user.current_workplace_id) {
          this.workloadService.getWorkload(user.uuid, user.current_workplace_id).subscribe({
            next: (response: any) => {
              if(response.data.workload) {
                this.workloadStats = response.data.workload.stats || {
                  total: 0,
                  overdue: 0,
                  todo: 0,
                  inProgress: 0,
                  done: 0
                }
                this.todayTasks = Array.isArray(response.data.workload.today) ? response.data.workload.today : []
                this.tomorrowTasks = Array.isArray(response.data.workload.tomorrow) ? response.data.workload.tomorrow : []
                this.nextWeekTasks = Array.isArray(response.data.workload.nextWeek) ? response.data.workload.nextWeek : []
              } else {
                // If no workload data, ensure arrays are empty
                this.todayTasks = []
                this.tomorrowTasks = []
                this.nextWeekTasks = []
              }
              console.log('Workload data loaded:', {
                todayTasks: this.todayTasks.length,
                tomorrowTasks: this.tomorrowTasks.length,
                nextWeekTasks: this.nextWeekTasks.length,
                currentTheme: this.currentTheme
              })
              this.isLoading = false
            },
            error: (err: Error) => {
              this.error = 'Failed to load workload data'
              // Ensure arrays are empty on error to show empty states
              this.todayTasks = []
              this.tomorrowTasks = []
              this.nextWeekTasks = []
              this.isLoading = false
              console.log('Error loading workload, arrays reset to empty for empty states')
              this.toastService.error('Failed to load workload data. Please try again.')
            }
          })
        } else {
          this.error = 'No workplace selected'
          // Ensure arrays are empty when no workplace
          this.todayTasks = []
          this.tomorrowTasks = []
          this.nextWeekTasks = []
          this.isLoading = false
        }
      },
      error: (err: Error) => {
        this.error = 'Failed to load user data'
        // Ensure arrays are empty on user data error
        this.todayTasks = []
        this.tomorrowTasks = []
        this.nextWeekTasks = []
        this.isLoading = false
        this.toastService.error('Failed to load user data. Please try again.')
      }
    })
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'overdue': return 'bg-error text-error-content'
      case 'todo': return 'bg-warning text-warning-content'
      case 'in-progress': return 'bg-success text-success-content'
      case 'done': return 'bg-info text-info-content'
      default: return 'bg-base-300'
    }
  }

  getRecentActivityEmptyStateImage(): string {
    const imageUrl = this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/placeholder_recent-activity-dark.svg'
      : 'https://media.octonius.com/assets/placeholder_recent-activity.svg'
    
    console.log('Empty state image for theme:', this.currentTheme, 'URL:', imageUrl)
    return imageUrl
  }
} 