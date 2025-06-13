import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

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
export class WorkloadComponent {
  userName = 'Cosmin'
  
  workloadStats = {
    total: 12,
    overdue: 3,
    todo: 5,
    inProgress: 2,
    done: 2
  }
  
  todayTasks: Task[] = [
    {
      title: 'Design the main screens for authentication',
      dueDate: 'Jan 10, 2025',
      team: 'Development team',
      status: 'overdue',
      priority: 'high'
    },
    {
      title: 'Create wireframes for the settings page',
      dueDate: 'Jan 10, 2025',
      team: 'Design team',
      status: 'todo',
      priority: 'medium'
    },
    {
      title: 'Develop prototypes for user onboarding',
      dueDate: 'Jan 10, 2025',
      team: 'UX team',
      status: 'in-progress',
      priority: 'medium'
    },
    {
      title: 'Develop prototypes for user onboarding',
      dueDate: 'Jan 10, 2025',
      team: 'UX team',
      status: 'done',
      priority: 'low'
    }
  ]
  
  tomorrowTasks: Task[] = [
    {
      title: 'Conduct user research for feature validation',
      dueDate: 'Feb 15, 2025',
      team: 'Product Management',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Design wireframes for the mobile app',
      dueDate: 'Mar 5, 2025',
      team: 'Mobile Development',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Implement accessibility improvements',
      dueDate: 'Apr 20, 2025',
      team: 'Web Development',
      status: 'todo',
      priority: 'high'
    }
  ]
  
  nextWeekTasks: Task[] = [
    {
      title: 'Revise user feedback questionnaires',
      dueDate: 'May 15, 2025',
      team: 'User Research',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Launch beta testing phase',
      dueDate: 'Jun 10, 2025',
      team: 'Product Testing',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Finalize UI design specifications',
      dueDate: 'Jul 30, 2025',
      team: 'Design',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Prepare marketing strategy for launch',
      dueDate: 'Aug 25, 2025',
      team: 'Marketing',
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Conduct security audits',
      dueDate: 'Sep 15, 2025',
      team: 'Security',
      status: 'todo',
      priority: 'high'
    }
  ]
  
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