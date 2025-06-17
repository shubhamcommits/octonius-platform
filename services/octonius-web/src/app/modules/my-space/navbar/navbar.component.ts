import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() activeTab: string = 'my-space'
  
  mainTabs = [
    { id: 'inbox', label: 'Inbox', route: '/dashboard/inbox' },
    { id: 'workload', label: 'Workload', route: '/dashboard/workload' },
    { id: 'files', label: 'Files', route: '/dashboard/files' },
    { id: 'workplace', label: 'Workplace', route: '/dashboard/workplace' },
    { id: 'account', label: 'Account', route: '/dashboard/account' }
  ]
} 