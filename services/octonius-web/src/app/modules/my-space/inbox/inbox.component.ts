import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { UserService } from '../../../core/services/user.service'
import { WorkloadService } from '../../shared/services/workload.service'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'
import { ThemeService } from '../../../core/services/theme.service'
import { Subscription } from 'rxjs'
import { User } from '../../../core/services/auth.service'

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
  user: User | null = null
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

  // Task sections for inbox
  todayTasks: any[] = []
  tomorrowTasks: any[] = []
  thisWeekTasks: any[] = []
  nextWeekTasks: any[] = []

  // Pagination state for each section
  paginationState = {
    today: { page: 1, limit: 5, total: 0, hasNext: false, hasPrev: false },
    tomorrow: { page: 1, limit: 5, total: 0, hasNext: false, hasPrev: false },
    thisWeek: { page: 1, limit: 5, total: 0, hasNext: false, hasPrev: false },
    nextWeek: { page: 1, limit: 5, total: 0, hasNext: false, hasPrev: false }
  }

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

  get userAvatar(): string | null {
    return this.user?.avatar_url || null;
  }

  get userInitials(): string {
    if (!this.user) return '';
    const firstName = this.user.first_name || '';
    const lastName = this.user.last_name || '';
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  getRecentActivityEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/placeholder_recent-activity-dark.svg'
      : 'https://media.octonius.com/assets/placeholder_recent-activity.svg'
  }

  getMessagesEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/placeholder_messages-dark.svg'
      : 'https://media.octonius.com/assets/placeholder_messages.svg'
  }

  getLoungeNewsEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/placeholder_lounge-dark.svg'
      : 'https://media.octonius.com/assets/placeholder_lounge.svg'
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (user_data: User) => {
        const user = user_data
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        this.user = user; // Assign the user object to the component's user property
        // Fetch workload/activity/messages/news for this user and workplace
        const userId = user.uuid
        const workplaceId = user.current_workplace_id
        if (userId && workplaceId) {
          this.workloadService.getWorkload(userId, workplaceId).subscribe({
            next: (response: any) => {

              if(response.data.workload) {
                this.workloadStats = response.data.workload.stats || {
                  total: 0,
                  overdue: 0,
                  todo: 0,
                  inProgress: 0,
                  done: 0
                }
                this.recentActivity = response.data.workload.activity || []
                this.messages = response.data.workload.messages || []
                this.loungeNews = response.data.workload.news || []
              } else {
                // Set default values if workload data is not available
                this.workloadStats = {
                  total: 0,
                  overdue: 0,
                  todo: 0,
                  inProgress: 0,
                  done: 0
                }
                this.recentActivity = []
                this.messages = []
                this.loungeNews = []
              }

              // Load paginated tasks for each section
              this.loadPaginatedTasks('today', 1);
              this.loadPaginatedTasks('tomorrow', 1);
              this.loadPaginatedTasks('thisWeek', 1);
              this.loadPaginatedTasks('nextWeek', 1);

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

  // Load paginated tasks for a specific section
  loadPaginatedTasks(section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek', page: number = 1): void {
    if (!this.user?.uuid || !this.user?.current_workplace_id) return;

    const pagination = this.paginationState[section];
    this.workloadService.getPaginatedTasks(
      this.user.uuid,
      this.user.current_workplace_id,
      section,
      page,
      pagination.limit
    ).subscribe({
      next: (response: any) => {
        if (response.data) {
          // Update the appropriate task array
          switch (section) {
            case 'today':
              this.todayTasks = response.data.tasks;
              break;
            case 'tomorrow':
              this.tomorrowTasks = response.data.tasks;
              break;
            case 'thisWeek':
              this.thisWeekTasks = response.data.tasks;
              break;
            case 'nextWeek':
              this.nextWeekTasks = response.data.tasks;
              break;
          }
          
          // Update pagination state
          this.paginationState[section] = {
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            hasNext: response.data.pagination.hasNext,
            hasPrev: response.data.pagination.hasPrev
          };
          
          console.log(`${section} pagination updated:`, {
            page: response.data.pagination.page,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
            hasNext: response.data.pagination.hasNext,
            hasPrev: response.data.pagination.hasPrev,
            tasksLoaded: response.data.tasks.length
          });
        }
      },
      error: (err: Error) => {
        console.error(`Error loading paginated ${section} tasks:`, err);
        this.toastService.error(`Failed to load ${section} tasks. Please try again.`);
      }
    });
  }

  // Navigation methods for pagination
  nextPage(section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'): void {
    const currentState = this.paginationState[section];
    if (currentState.hasNext) {
      this.loadPaginatedTasks(section, currentState.page + 1);
    }
  }

  prevPage(section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'): void {
    const currentState = this.paginationState[section];
    if (currentState.hasPrev) {
      this.loadPaginatedTasks(section, currentState.page - 1);
    }
  }

  // Get pagination info for a section
  getPaginationInfo(section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'): any {
    return this.paginationState[section];
  }

  // Task-related methods (similar to workload component)
  getTaskSidebarColor(task: any): string {
    // If task is overdue, show red sidebar regardless of status
    if (this.isOverdue(task.dueDate)) {
      return 'bg-error'
    }
    
    // Otherwise use status-based color
    switch (task.status) {
      case 'overdue': return 'bg-error'
      case 'todo': return 'bg-warning'
      case 'in_progress': return 'bg-success'
      case 'review': return 'bg-info'
      case 'done': return 'bg-success'
      default: return 'bg-base-300'
    }
  }

  isOverdue(dueDate: string | Date | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  onTaskClick(task: any): void {
    if (task.group_id && task.id) {
      // Navigate to task detail
      console.log('Navigate to task:', task.id, 'in group:', task.group_id);
    }
  }
} 