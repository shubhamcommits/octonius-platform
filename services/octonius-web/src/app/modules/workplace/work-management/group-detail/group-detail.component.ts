import { Component, ElementRef, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterEvent, UrlSegment } from '@angular/router';
import { WorkGroup, WorkGroupService } from '../../services/work-group.service';
import { GroupMember } from '../../services/group-member.service';
import { MemberActionsModalService } from './group-admin/services/member-actions-modal.service';
import { GroupMemberService } from '../../services/group-member.service';
import { ToastService } from '../../../../core/services/toast.service';
import { filter, map, startWith, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-group-detail',
  standalone: false,
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.scss'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0
        }),
        animate('300ms ease-out', 
          style({ 
            opacity: 1
          })
        )
      ]),
      transition(':leave', [
        animate('300ms ease-in', 
          style({ 
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  activeView: string = 'activity';
  selectedMemberForActions: GroupMember | null = null;
  private destroy$ = new Subject<void>();
  
  // Dropdown state
  isDropdownOpen = false;

  menuItems = [
    { label: 'Dashboard', description: 'Your team\'s dashboard', icon: 'LayoutDashboard', route: './dashboard' },
    { label: 'Activity', description: 'For team communication', icon: 'MessageSquare', route: './activity' },
    { label: 'Tasks', description: 'This is where work happens', icon: 'CheckSquare', route: './tasks' },
    { label: 'Admin Area', description: 'Manage the group settings', icon: 'Settings', route: './admin' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workGroupService: WorkGroupService,
    private memberActionsModalService: MemberActionsModalService,
    private groupMemberService: GroupMemberService,
    private toastService: ToastService,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('uuid');
    if (groupId) {
      this.workGroupService.getGroup(groupId).subscribe(group => {
        this.group = group;
        this.workGroupService.setCurrentGroup(group);
      });
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects),
      startWith(this.router.url),
      map(url => {
        const urlSegments = url.split('/');
        return urlSegments.pop() || 'activity';
      })
    ).subscribe(view => {
      this.activeView = view;
    });

    // Subscribe to modal state
    this.memberActionsModalService.selectedMember$
      .pipe(takeUntil(this.destroy$))
      .subscribe(member => {
        this.selectedMemberForActions = member;
        this.cdr.detectChanges(); // Force change detection
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isTaskDetailRoute(): boolean {
    // Check if the current child route matches 'tasks/:taskId'
    const child = this.route.firstChild;
    if (!child) return false;
    const segments = child.snapshot.url;
    return segments.length === 2 && segments[0].path === 'tasks';
  }

  cleanRoute(route: string): string {
    return route.replace('./', '');
  }

  // Dropdown management
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  onNavigate(route: string): void {
    this.router.navigate([route], { relativeTo: this.route });
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  // Modal management
  closeMemberActionsModal(): void {
    this.memberActionsModalService.closeModal();
    this.cdr.detectChanges();
  }

  updateMemberRole(member: GroupMember, newRole: 'admin' | 'member' | 'viewer'): void {
    if (!this.group) return;
    
    this.groupMemberService.updateMemberRole(this.group.uuid, member.uuid, newRole).subscribe({
      next: (updatedMember) => {
        this.toastService.success(`${member.user.displayName}'s role updated to ${newRole}`);
        this.closeMemberActionsModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.error('Failed to update member role');
        this.cdr.detectChanges();
      }
    });
  }

  removeMember(member: GroupMember): void {
    if (!this.group) return;
    
    if (confirm(`Are you sure you want to remove ${member.user.displayName} from this group?`)) {
      this.groupMemberService.removeMember(this.group.uuid, member.uuid).subscribe({
        next: () => {
          this.toastService.success('Member removed successfully');
          this.closeMemberActionsModal();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastService.error('Failed to remove member');
          this.cdr.detectChanges();
        }
      });
    }
  }
}
