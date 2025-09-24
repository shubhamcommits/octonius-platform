import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { WorkGroupService, WorkGroup } from '../services/work-group.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CreateGroupData, CreateGroupModalComponent } from './create-group-modal/create-group-modal.component';
import { GroupSelectionComponent } from '../../shared/components/group-selection/group-selection.component';

@Component({
  selector: 'app-work-management',
  standalone: true,
  templateUrl: './work-management.component.html',
  styleUrls: ['./work-management.component.scss'],
  imports: [GroupSelectionComponent, CreateGroupModalComponent]
})
export class WorkManagementComponent implements OnInit, OnDestroy {
  showCreateModal = false;
  isSubmitting = false;
  private themeSubscription!: Subscription;
  
  private destroy$ = new Subject<void>();

  constructor(
    private workGroupService: WorkGroupService,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    // Set up search with debounce
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      // Handle theme changes if needed
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get empty state image based on current theme
   */
  getWorkGroupsEmptyStateImage(): string {
    return 'https://media.octonius.com/assets/no-lounge-light.svg';
  }

  /**
   * Get empty state image for search results
   */
  getSearchEmptyStateImage(): string {
    return 'https://media.octonius.com/assets/no-lounge-light.svg';
  }

  getEmptyStateImage(): string {
    return this.getWorkGroupsEmptyStateImage();
  }

  getEmptyStateMessage(): string {
    return 'You don\'t have access to any groups yet. Contact your administrator to get added to a group.';
  }

  onAddGroup(): void {
    this.showCreateModal = true;
  }

  onGroupClick(group: WorkGroup): void {
    this.router.navigate(['/workplace/work-management', group.uuid]);
  }

  onSearch(event: any): void {
    // Search is now handled by the reusable component
    console.log('Search event:', event);
  }

  onFilter(): void {
    // Filter is now handled by the reusable component
    console.log('Filter clicked');
  }

  onSort(): void {
    // Sort is now handled by the reusable component
    console.log('Sort clicked');
  }

  handleModalClose(): void {
    this.showCreateModal = false;
  }

  handleGroupCreated(data: CreateGroupData): void {
    this.isSubmitting = true;
    
    // Get current user to get workplace ID
    const user = this.authService.getCurrentUser();
    if (!user || !user.current_workplace_id) {
      this.toastService.error('No workplace selected. Please select a workplace to continue.');
      this.isSubmitting = false;
      return;
    }
    
    // Add workplace ID to the data
    const groupData = {
      ...data,
      workplaceId: user.current_workplace_id
    };
    
    this.workGroupService.createGroup(groupData).subscribe({
      next: (group) => {
        this.toastService.success('Group created successfully!');
        this.showCreateModal = false;
        this.isSubmitting = false;
        // Optionally refresh the group list or navigate to the new group
        this.router.navigate(['/workplace/work-management', group.uuid]);
      },
      error: (error) => {
        this.toastService.error('Failed to create group. Please try again.');
        this.isSubmitting = false;
        console.error('Error creating group:', error);
      }
    });
  }
}