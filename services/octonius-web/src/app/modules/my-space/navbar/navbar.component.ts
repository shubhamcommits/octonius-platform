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
    { id: 'my-space', label: 'My Space', route: '/dashboard/my-space' },
    { id: 'workplace', label: 'Workplace', route: '/dashboard/workplace' },
    { id: 'account', label: 'Account', route: '/dashboard/account' }
  ]
  
  mySpaceTabs = [
    { id: 'inbox', label: 'Inbox', route: '/dashboard/my-space/inbox' },
    { id: 'workload', label: 'Workload', route: '/dashboard/my-space/workload' },
    { id: 'files', label: 'Files', route: '/dashboard/my-space/files' }
  ]
} 