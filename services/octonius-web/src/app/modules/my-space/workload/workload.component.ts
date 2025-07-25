import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
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
  user: User | null = null
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
  thisWeekTasks: any[] = []
  nextWeekTasks: any[] = []
  currentTheme = 'light'
  private themeSubscription: Subscription

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
    private themeService: ThemeService,
    private router: Router
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

  loadData(): void {
    this.isLoading = true
    this.error = null

    this.userService.getCurrentUser().subscribe({
      next: (user_data: User) => {
        const user = user_data
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        this.user = user; // Assign user to the component's user property
        if (user.uuid && user.current_workplace_id) {
          // Load workload stats first
          this.workloadService.getWorkload(user.uuid, user.current_workplace_id).subscribe({
            next: (response: any) => {
              if(response.data?.workload) {
                this.workloadStats = response.data.workload.stats || {
                  total: 0,
                  overdue: 0,
                  todo: 0,
                  inProgress: 0,
                  done: 0
                }
              } else {
                this.workloadStats = {
                  total: 0,
                  overdue: 0,
                  todo: 0,
                  inProgress: 0,
                  done: 0
                }
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
              // Ensure arrays are empty on error to show empty states
              this.todayTasks = []
              this.tomorrowTasks = []
              this.thisWeekTasks = []
              this.nextWeekTasks = []
              this.isLoading = false
              console.error('Error loading workload:', err)
              this.toastService.error('Failed to load workload data. Please try again.')
            }
          })
        } else {
          this.error = 'No workplace selected'
          // Ensure arrays are empty when no workplace
          this.todayTasks = []
          this.tomorrowTasks = []
          this.thisWeekTasks = []
          this.nextWeekTasks = []
          this.isLoading = false
        }
      },
      error: (err: Error) => {
        this.error = 'Failed to load user data'
        // Ensure arrays are empty on user data error
        this.todayTasks = []
        this.tomorrowTasks = []
        this.thisWeekTasks = []
        this.nextWeekTasks = []
        this.isLoading = false
        console.error('Error loading user data:', err)
        this.toastService.error('Failed to load user data. Please try again.')
      }
    })
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'overdue': return 'bg-error text-error-content'
      case 'todo': return 'bg-warning text-warning-content'
      case 'in_progress': return 'bg-success text-success-content'
      case 'review': return 'bg-info text-info-content'
      case 'done': return 'bg-success text-success-content'
      default: return 'bg-base-300'
    }
  }

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
      this.router.navigate(['/workplace/work-management', task.group_id, 'tasks', task.id]);
    }
  }

  getRecentActivityEmptyStateImage(): string {
    const imageUrl = this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/placeholder_recent-activity-dark.svg'
      : 'https://media.octonius.com/assets/placeholder_recent-activity.svg'
    
    console.log('Empty state image for theme:', this.currentTheme, 'URL:', imageUrl)
    return imageUrl
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
} 