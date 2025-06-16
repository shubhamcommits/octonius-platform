import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserService } from '../../../core/services/user.service'
import { User } from '../../../core/services/auth.service'
import { WorkloadService } from '../../shared/services/workload.service'

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
  imports: [CommonModule],
  templateUrl: './workload.component.html',
  styleUrls: ['./workload.component.scss']
})
export class WorkloadComponent implements OnInit {
  userName = ''
  isLoading = true
  error: string | null = null
  workloadStats: any = null
  todayTasks: any[] = []
  tomorrowTasks: any[] = []
  nextWeekTasks: any[] = []

  constructor(
    private userService: UserService,
    private workloadService: WorkloadService
  ) {}

  ngOnInit() {
    this.isLoading = true
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        if (user.uuid && user.current_workplace_id) {
          this.workloadService.getWorkload(user.uuid, user.current_workplace_id).subscribe({
            next: (data: any) => {
              this.workloadStats = data.stats
              this.todayTasks = data.today || []
              this.tomorrowTasks = data.tomorrow || []
              this.nextWeekTasks = data.nextWeek || []
              this.isLoading = false
            },
            error: (err: Error) => {
              this.error = 'Failed to load workload data'
              this.isLoading = false
              console.error('Error loading workload:', err)
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
        console.error('Error loading user:', err)
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