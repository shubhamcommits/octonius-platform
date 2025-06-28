import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WorkGroupService, WorkGroup } from '../services/work-group.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Subscription } from 'rxjs';
import { CreateGroupData } from './create-group-modal/create-group-modal.component';

@Component({
  selector: 'app-work-management',
  standalone: false,
  templateUrl: './work-management.component.html',
  styleUrls: ['./work-management.component.scss']
})
export class WorkManagementComponent implements OnInit, OnDestroy {
  groups: WorkGroup[] = [];
  filteredGroups: WorkGroup[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  currentWorkplaceId: string | null = null;
  currentTheme: string = 'light';
  showCreateModal = false;
  isSubmitting = false;
  private themeSubscription: Subscription;
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private workGroupService: WorkGroupService,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit(): void {
    this.getCurrentWorkplace();
    this.loadGroups();
    
    // Set up search with debounce
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
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
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-lounge-light.svg'
      : 'https://media.octonius.com/assets/no-lounge-dark.svg'
  }

  /**
   * Get empty state image for search results
   */
  getSearchEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-lounge-light.svg'
      : 'https://media.octonius.com/assets/no-lounge-dark.svg'
  }

  private getCurrentWorkplace(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentWorkplaceId = currentUser?.current_workplace_id || null;
    
    if (!this.currentWorkplaceId) {
      this.toastService.error('No workplace selected. Please select a workplace to continue.');
      // Optionally redirect to workplace selection
      // this.router.navigate(['/workplace/select']);
    }
  }

  loadGroups(): void {
    if (!this.currentWorkplaceId) {
      this.toastService.error('No workplace selected');
      return;
    }

    this.isLoading = true;
    this.workGroupService.getGroups(this.currentWorkplaceId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (groups) => {
        this.groups = groups;
        this.filteredGroups = groups;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.toastService.error('Failed to load work groups');
        this.isLoading = false;
      }
    });
  }

  onAddGroup(): void {
    this.showCreateModal = true;
  }

  onGroupClick(group: WorkGroup): void {
    this.router.navigate(['/workplace/work-management', group.uuid]);
  }

  onSearch(event: any): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject$.next(this.searchTerm);
  }

  performSearch(searchTerm: string): void {
    if (!this.currentWorkplaceId) {
      this.toastService.error('No workplace selected');
      return;
    }

    if (!searchTerm.trim()) {
      this.filteredGroups = this.groups;
      return;
    }

    this.workGroupService.searchGroups(this.currentWorkplaceId, searchTerm).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (groups) => {
        this.filteredGroups = groups;
      },
      error: (error) => {
        console.error('Error searching groups:', error);
        this.toastService.error('Search failed');
      }
    });
  }

  onFilter() {
    // Implement filter functionality
    console.log('Filter groups');
    // Could open a filter modal or dropdown
  }

  onSort(): void {
    // Implement sort functionality
    console.log('Sort groups');
    // Simple example: sort by name
    this.filteredGroups.sort((a, b) => a.name.localeCompare(b.name));
  }

  get displayGroups(): WorkGroup[] {
    return this.filteredGroups;
  }

  /**
   * Check if we're showing search results
   */
  get isShowingSearchResults(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  /**
   * Get the appropriate empty state image based on context
   */
  getEmptyStateImage(): string {
    if (this.isShowingSearchResults) {
      return this.getSearchEmptyStateImage();
    }
    return this.getWorkGroupsEmptyStateImage();
  }

  /**
   * Get the appropriate empty state message based on context
   */
  getEmptyStateMessage(): string {
    if (this.isShowingSearchResults) {
      return `No groups found matching "${this.searchTerm}". Try adjusting your search terms.`;
    }
    return 'No work groups found. Create your first group to get started.';
  }

  onAdd() {
    this.showCreateModal = true;
  }

  handleModalClose() {
    this.showCreateModal = false;
  }

  handleGroupCreated(data: CreateGroupData) {
    this.isSubmitting = true;
    
    if (!this.currentWorkplaceId) {
      this.toastService.error('No workplace selected.');
      this.isSubmitting = false;
      return;
    }
    
    const groupData = {
      ...data,
      workplaceId: this.currentWorkplaceId
    };
    
    // Show loading toast
    this.toastService.info('Creating group...', 0);
    
    this.workGroupService.createGroup(groupData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.toastService.clear();
        this.toastService.success('Group created successfully!');
        this.loadGroups(); // Reload groups to show the new one
      },
      error: (error) => {
        console.error('Error creating group:', error);
        this.isSubmitting = false;
        this.toastService.clear();
        this.toastService.error('Failed to create group. Please try again.');
      }
    });
  }
}
