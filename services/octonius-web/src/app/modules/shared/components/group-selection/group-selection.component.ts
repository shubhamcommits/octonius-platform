import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { WorkGroupService, WorkGroup } from '../../../workplace/services/work-group.service'
import { ToastService } from '../../../../core/services/toast.service'
import { AuthService } from '../../../../core/services/auth.service'
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs'
import { SharedModule } from '../../shared.module'
import { FilterOptions } from '../topbar/topbar.component'

@Component({
  selector: 'app-group-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './group-selection.component.html',
  styleUrls: ['./group-selection.component.scss']
})
export class GroupSelectionComponent implements OnInit, OnDestroy {
  @Input() redirectPath: string = '/workplace/work-management' // Default path for redirection
  @Input() showHeader: boolean = true // Whether to show the header section
  @Input() title: string = 'Work Management' // Customizable title
  @Input() description: string = 'Organize your work with groups, collaborate with team members, and track progress efficiently.' // Customizable description
  @Input() showCreateButton: boolean = true // Whether to show create group button
  @Input() showSearch: boolean = false // Whether to show search functionality
  @Input() showFilter: boolean = true // Whether to show filter functionality
  @Input() showSort: boolean = true // Whether to show sort functionality
  @Input() searchPlaceholder: string = 'Search groups...' // Customizable search placeholder
  @Input() emptyStateImage: string = 'https://media.octonius.com/assets/icon_projects.svg' // Customizable empty state image
  @Input() emptyStateMessage: string = 'You don\'t have access to any groups yet. Contact your administrator to get added to a group.' // Customizable empty state message
  @Input() createButtonText: string = 'Create Your First Group' // Customizable create button text
  
  @Output() groupSelected = new EventEmitter<WorkGroup>() // Emit when group is selected
  @Output() createGroup = new EventEmitter<void>() // Emit when create group is clicked
  @Output() search = new EventEmitter<string>() // Emit when search is performed
  @Output() filter = new EventEmitter<FilterOptions>() // Emit when filter is applied
  @Output() sort = new EventEmitter<void>() // Emit when sort is clicked
  
  groups: WorkGroup[] = []
  filteredGroups: WorkGroup[] = []
  isLoading: boolean = true
  error: string | null = null
  searchTerm: string = ''
  isShowingSearchResults: boolean = false
  
  // Sort functionality
  showSortDropdown = false
  currentSortBy = 'name'
  currentSortOrder: 'asc' | 'desc' = 'asc'
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'memberCount', label: 'Member Count' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Last Updated' }
  ]
  
  private destroy$ = new Subject<void>()
  private searchSubject$ = new Subject<string>()

  constructor(
    private workGroupService: WorkGroupService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups()
    this.setupSearchSubscription()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm)
      })
  }

  async loadGroups(): Promise<void> {
    try {
      this.isLoading = true
      this.error = null

      // Get current user to get workplace ID
      const user = this.authService.getCurrentUser()
      if (!user || !user.current_workplace_id) {
        throw new Error('No workplace selected')
      }

      // Load all groups for the current workplace
      const groups = await firstValueFrom(this.workGroupService.getGroups(user.current_workplace_id))
      this.groups = groups as WorkGroup[]
      this.filteredGroups = [...this.groups]
      this.applySorting() // Apply default sorting
      this.isLoading = false
    } catch (err) {
      this.error = 'Failed to load groups. Please try again.'
      this.isLoading = false
      this.toastService.error('Failed to load groups. Please try again.')
      console.error('Error loading groups:', err)
    }
  }

  onGroupSelect(group: WorkGroup): void {
    this.groupSelected.emit(group)
    // Navigate to the configured path with group UUID
    this.router.navigate([this.redirectPath, group.uuid])
  }

  onImageError(event: any, group: WorkGroup): void {
    // Hide the image and show the default icon when image fails to load
    group.imageUrl = null
    event.target.style.display = 'none'
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm
    this.searchSubject$.next(searchTerm)
    this.search.emit(searchTerm)
  }

  private performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredGroups = [...this.groups]
      this.isShowingSearchResults = false
      return
    }

    const query = searchTerm.toLowerCase().trim()
    this.filteredGroups = this.groups.filter(group => 
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.metadata?.category?.toLowerCase().includes(query) ||
      group.metadata?.department?.toLowerCase().includes(query) ||
      group.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    )
    this.isShowingSearchResults = true
  }

  onFilter(filterOptions: FilterOptions): void {
    this.applyFilters(filterOptions)
    this.filter.emit(filterOptions)
  }

  applyFilters(filterOptions: FilterOptions): void {
    let filtered = [...this.groups]

    // Group Type Filter
    if (filterOptions.groupType.length > 0) {
      filtered = filtered.filter(group => filterOptions.groupType.includes(group.type))
    }

    // Visibility Filter
    if (filterOptions.visibility.length > 0) {
      filtered = filtered.filter(group => filterOptions.visibility.includes(group.settings.visibility))
    }

    // Member Count Filter
    if (filterOptions.memberCount) {
      const memberCount = filterOptions.memberCount
      filtered = filtered.filter(group => {
        switch (memberCount) {
          case '1-5':
            return group.memberCount >= 1 && group.memberCount <= 5
          case '6-20':
            return group.memberCount >= 6 && group.memberCount <= 20
          case '21-50':
            return group.memberCount >= 21 && group.memberCount <= 50
          case '50+':
            return group.memberCount > 50
          default:
            return true
        }
      })
    }

    // Category Filter
    if (filterOptions.category.length > 0) {
      filtered = filtered.filter(group => 
        group.metadata?.category && filterOptions.category.includes(group.metadata.category)
      )
    }

    // Department Filter
    if (filterOptions.department.length > 0) {
      filtered = filtered.filter(group => 
        group.metadata?.department && filterOptions.department.includes(group.metadata.department)
      )
    }

    // Tags Filter
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter(group => 
        group.metadata?.tags && group.metadata.tags.some(tag => filterOptions.tags.includes(tag))
      )
    }

    // Created Date Filter
    if (filterOptions.createdDate) {
      const now = new Date()
      const createdDate = filterOptions.createdDate
      
      filtered = filtered.filter(group => {
        const groupDate = new Date(group.createdAt)
        switch (createdDate) {
          case 'today':
            return groupDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return groupDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return groupDate >= monthAgo
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            return groupDate >= quarterAgo
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            return groupDate >= yearAgo
          default:
            return true
        }
      })
    }

    this.filteredGroups = filtered
    this.applySorting() // Apply current sort settings
  }

  onSort(): void {
    this.sort.emit()
  }

  // Sort functionality
  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown
  }

  closeSortDropdown(): void {
    this.showSortDropdown = false
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showSortDropdown) {
      const target = event.target as HTMLElement
      const sortContainer = target.closest('.relative')
      if (!sortContainer) {
        this.closeSortDropdown()
      }
    }
  }

  onSortByChange(sortBy: string): void {
    this.currentSortBy = sortBy
    this.applySorting()
    this.showSortDropdown = false
  }

  onSortOrderChange(order: 'asc' | 'desc'): void {
    this.currentSortOrder = order
    this.applySorting()
    this.showSortDropdown = false
  }

  applySorting(): void {
    this.filteredGroups.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (this.currentSortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'memberCount':
          aValue = a.memberCount
          bValue = b.memberCount
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (this.currentSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  onCreateGroup(): void {
    this.createGroup.emit()
  }

  get displayGroups(): WorkGroup[] {
    return this.filteredGroups
  }

  get isEmpty(): boolean {
    return this.displayGroups.length === 0
  }

  getGroupIcon(group: WorkGroup): string {
    // Return appropriate icon based on group type or name
    const name = group.name.toLowerCase()
    
    if (name.includes('sales')) return 'TrendingUp'
    if (name.includes('engineering') || name.includes('development')) return 'Code'
    if (name.includes('support')) return 'Headphones'
    if (name.includes('operations')) return 'Settings'
    if (name.includes('production')) return 'Factory'
    if (name.includes('manager')) return 'Users'
    if (name.includes('customer')) return 'MessageCircle'
    if (name.includes('marketing')) return 'Megaphone'
    if (name.includes('crm')) return 'Database'
    if (name.includes('board')) return 'Crown'
    
    // Default icon
    return 'Folder'
  }

  getGroupColor(group: WorkGroup): string {
    // Return appropriate color based on group type
    const name = group.name.toLowerCase()
    
    if (name.includes('sales')) return 'text-green-600'
    if (name.includes('engineering') || name.includes('development')) return 'text-blue-600'
    if (name.includes('support')) return 'text-orange-600'
    if (name.includes('operations')) return 'text-purple-600'
    if (name.includes('production')) return 'text-red-600'
    if (name.includes('manager')) return 'text-indigo-600'
    if (name.includes('customer')) return 'text-cyan-600'
    if (name.includes('marketing')) return 'text-pink-600'
    if (name.includes('crm')) return 'text-teal-600'
    if (name.includes('board')) return 'text-yellow-600'
    
    // Default color
    return 'text-gray-600'
  }

  getGroupDescription(group: WorkGroup): string {
    // Return appropriate description based on group type
    const name = group.name.toLowerCase()
    
    if (name.includes('sales')) return 'Sales team files and documents'
    if (name.includes('engineering') || name.includes('development')) return 'Code repositories and technical docs'
    if (name.includes('support')) return 'Customer support resources'
    if (name.includes('operations')) return 'Operational procedures and reports'
    if (name.includes('production')) return 'Production files and workflows'
    if (name.includes('manager')) return 'Management documents and reports'
    if (name.includes('customer')) return 'Customer-related files and data'
    if (name.includes('marketing')) return 'Marketing materials and campaigns'
    if (name.includes('crm')) return 'CRM data and customer records'
    if (name.includes('board')) return 'Board meeting notes and decisions'
    
    // Default description
    return 'Group files and documents'
  }

  getAvailableCategories(): string[] {
    const categories = new Set<string>()
    this.groups.forEach(group => {
      if (group.metadata?.category) {
        categories.add(group.metadata.category)
      }
    })
    return Array.from(categories).sort()
  }

  getAvailableDepartments(): string[] {
    const departments = new Set<string>()
    this.groups.forEach(group => {
      if (group.metadata?.department) {
        departments.add(group.metadata.department)
      }
    })
    return Array.from(departments).sort()
  }

  getAvailableTags(): string[] {
    const tags = new Set<string>()
    this.groups.forEach(group => {
      if (group.metadata?.tags) {
        group.metadata.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }
}
