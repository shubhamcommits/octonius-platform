import { Component, Input, ElementRef, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { SharedModule } from '../../shared.module'

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() activeTab: string = 'myspace'
  
  mainTabs = [
    { id: 'myspace', label: 'My Space' },
    { id: 'workplace', label: 'Workplace' },
    { id: 'account', label: 'Account' }
  ]

  openDropdown: string | null = null;

  constructor(private router: Router, private eRef: ElementRef) {}

  onTabClick(tabId: string) {
    this.openDropdown = this.openDropdown === tabId ? null : tabId;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.openDropdown = null;
    }
  }

  goTo(section: string) {
    this.openDropdown = null;
    if (section === 'inbox') this.router.navigate(['/myspace/inbox']);
    if (section === 'tasks') this.router.navigate(['/myspace/workload']);
    if (section === 'files') this.router.navigate(['/myspace/files']);
  }

  goToWorkplace(section: string) {
    this.openDropdown = null;
    this.router.navigate(['/workplace', section]);
  }
} 