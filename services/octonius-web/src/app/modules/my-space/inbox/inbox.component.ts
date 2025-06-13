import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

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
export class InboxComponent {
  userName = 'Cosmin'
  
  workloadStats = {
    total: 12,
    overdue: 3,
    todo: 5,
    inProgress: 2,
    done: 2
  }
  
  recentActivity: Activity[] = [
    {
      user: 'Cosmin Ciobanu',
      avatar: '👤',
      action: 'assigned',
      item: 'Review logo design ...',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Development team'
    },
    {
      user: 'Elisabeth Paredes',
      avatar: '👤',
      action: 'completed',
      item: 'Review logo design ...',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Sales Department',
      status: 'completed'
    },
    {
      user: 'Miriam Wazniack',
      avatar: '👤',
      action: 'started',
      item: 'Review logo design ...',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Customer Support',
      status: 'started'
    }
  ]
  
  messages: Message[] = [
    {
      user: 'Cosmin Ciobanu',
      avatar: '👤',
      message: 'liked Please review the updates',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Development team'
    },
    {
      user: 'Elisabeth Paredes',
      avatar: '👤',
      message: 'posted Review logo design ...',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Sales Department'
    },
    {
      user: 'Miriam Wazniack',
      avatar: '👤',
      message: 'commented on Review logo design ...',
      time: 'Jan 10, 2025, 9:29 PM',
      team: 'Customer Support'
    }
  ]
  
  loungeNews: News[] = [
    {
      user: 'Cosmin Ciobanu',
      avatar: '👤',
      news: 'published Q4 2025 report',
      time: 'Jan 10, 2025, 9:29 PM'
    },
    {
      user: 'Elisabeth Paredes',
      avatar: '👤',
      news: 'launched event Townhall w/ CEO',
      time: 'Jan 10, 2025, 9:29 PM'
    },
    {
      user: 'Miriam Wazniack',
      avatar: '👤',
      news: 'published How to build a great culture for your team',
      time: 'Jan 10, 2025, 9:29 PM'
    }
  ]
} 