import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { UserService } from '../../../core/services/user.service'
import { User } from '../../../core/services/auth.service'
import { WorkloadService } from '../../shared/services/workload.service'
import { ToastService } from '../../../core/services/toast.service'

interface Activity {
  user: string
  avatar: string
  action: string
  item: string
  time: string
  team: string
  status?: string
}

interface Message {
  user: string
  avatar: string
  message: string
  time: string
  team: string
}

interface News {
  user: string
  avatar: string
  news: string
  time: string
}

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit {
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
  recentActivity: any[] = []
  messages: any[] = []
  loungeNews: any[] = []

  constructor(
    private userService: UserService,
    private workloadService: WorkloadService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.toastService.error('Failed to load user data. Please try again.')
    this.loadData()
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        // Fetch workload/activity/messages/news for this user and workplace
        const userId = user.uuid
        const workplaceId = user.current_workplace_id
        if (userId && workplaceId) {
          this.workloadService.getWorkload(userId, workplaceId).subscribe({
            next: (data: any) => {
              this.workloadStats = data.stats
              this.recentActivity = data.activity
              this.messages = data.messages
              this.loungeNews = data.news
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
} 