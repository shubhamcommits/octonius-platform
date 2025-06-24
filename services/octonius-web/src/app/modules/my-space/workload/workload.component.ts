import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserService } from '../../../core/services/user.service'
import { WorkloadService } from '../../shared/services/workload.service'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'

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
export class WorkloadComponent implements OnInit {
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

  constructor(
    private userService: UserService,
    private workloadService: WorkloadService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadData()
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        const user = response.data.user
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        if (user.uuid && user.current_workplace_id) {
          this.workloadService.getWorkload(user.uuid, user.current_workplace_id).subscribe({
            next: (response: any) => {
              if(response.data.workload) {
                this.workloadStats = response.data.workload.stats
                this.todayTasks = response.data.workload.today || []
                this.tomorrowTasks = response.data.workload.tomorrow || []
                this.nextWeekTasks = response.data.workload.nextWeek || []
              }
              this.isLoading = false
            },
            error: (err: Error) => {
              this.error = 'Failed to load workload data'
              this.isLoading = false
              this.toastService.error('Failed to load workload data. Please try again.')
            }
          })
        } else {
          this.error = 'No workplace selected'
          this.isLoading = false
        }
      },
      error: (err: Error) => {
        this.error = 'Failed to load user data'
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
} 