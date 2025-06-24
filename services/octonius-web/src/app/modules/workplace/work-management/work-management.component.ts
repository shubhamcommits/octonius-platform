import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WorkGroupService, WorkGroup } from '../services/work-group.service';
import { ToastService } from '../../../core/services/toast.service';

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
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private workGroupService: WorkGroupService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.workGroupService.getGroups().pipe(
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
    // Navigate to create group page or open modal
    console.log('Add new group');
    // this.router.navigate(['/workplace/work-management/create']);
  }

  onGroupClick(group: WorkGroup): void {
    this.router.navigate(['/workplace/work-management', group.uuid]);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject$.next(this.searchTerm);
  }

  performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredGroups = this.groups;
      return;
    }

    this.workGroupService.searchGroups(searchTerm).pipe(
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

  onFilter(): void {
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
}
