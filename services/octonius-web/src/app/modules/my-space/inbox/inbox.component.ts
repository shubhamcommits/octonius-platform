import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { UserService } from '../../../core/services/user.service'
import { WorkloadService } from '../../shared/services/workload.service'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'
import { ThemeService } from '../../../core/services/theme.service'
import { Subscription } from 'rxjs'

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
  imports: [CommonModule, RouterModule, CapitalizePipe],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit, OnDestroy {
  userName: string = 'User'
  isLoading: boolean = true
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
  currentTheme: string = 'light'
  private themeSubscription: Subscription;

  constructor(
    private userService: UserService,
    private workloadService: WorkloadService,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit(): void {
    this.loadData()
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  getRecentActivityEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-activity-light.svg'
      : 'https://media.octonius.com/assets/no-activity-dark.svg'
  }

  getMessagesEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-messages-light.svg'
      : 'https://media.octonius.com/assets/no-messages-dark.svg'
  }

  getLoungeNewsEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-lounge-light.svg'
      : 'https://media.octonius.com/assets/no-lounge-dark.svg'
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        const user = response.data.user
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        // Fetch workload/activity/messages/news for this user and workplace
        const userId = user.uuid
        const workplaceId = user.current_workplace_id
        if (userId && workplaceId) {
          this.workloadService.getWorkload(userId, workplaceId).subscribe({
            next: (response: any) => {

              if(response.data.workload) {
                this.workloadStats = response.data.workload.stats
                this.recentActivity = response.data.workload.activity
                this.messages = response.data.workload.messages
                this.loungeNews = response.data.workload.news
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
} 