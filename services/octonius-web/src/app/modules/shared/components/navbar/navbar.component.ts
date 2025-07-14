import { Component, Input, ElementRef, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { trigger, transition, style, animate } from '@angular/animations'

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translate(-50%, -50%) scale(0.95) translateY(-10px)'
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ 
            opacity: 1, 
            transform: 'translate(-50%, -50%) scale(1) translateY(0)'
          })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', 
          style({ 
            opacity: 0, 
            transform: 'translate(-50%, -50%) scale(0.95) translateY(-10px)'
          })
        )
      ])
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
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

  closeAllDropdowns() {
    this.openDropdown = null;
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

  goToAccount(section: string) {
    this.openDropdown = null;
    this.router.navigate(['/account', section]);
  }
} 