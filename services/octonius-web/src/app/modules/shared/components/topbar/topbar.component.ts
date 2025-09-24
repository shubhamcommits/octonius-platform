import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ListFilter, Plus, ChevronDown, X } from 'lucide-angular'

export interface FilterOptions {
  groupType: string[];
  visibility: string[];
  memberCount: string;
  category: string[];
  department: string[];
  tags: string[];
  createdDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() showFilter = true;
  @Input() showAdd = true;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() searchValue = '';
  @Input() availableCategories: string[] = [];
  @Input() availableDepartments: string[] = [];
  @Input() availableTags: string[] = [];

  @Output() filter = new EventEmitter<FilterOptions>();
  @Output() add = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  // Filter state
  showFilterDropdown = false;
  activeFilters: FilterOptions = {
    groupType: [],
    visibility: [],
    memberCount: '',
    category: [],
    department: [],
    tags: [],
    createdDate: '',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  // Filter options
  groupTypes = [
    { value: 'private', label: 'Private' },
    { value: 'regular', label: 'Regular' },
    { value: 'public', label: 'Public' }
  ];

  visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' }
  ];

  memberCountOptions = [
    { value: '', label: 'Any' },
    { value: '1-5', label: '1-5 members' },
    { value: '6-20', label: '6-20 members' },
    { value: '21-50', label: '21-50 members' },
    { value: '50+', label: '50+ members' }
  ];

  createdDateOptions = [
    { value: '', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'quarter', label: 'This quarter' },
    { value: 'year', label: 'This year' }
  ];

  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'memberCount', label: 'Member Count' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Last Updated' }
  ];

  onFilter() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  onAdd() {
    this.add.emit();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  onSearchClick() {
    this.search.emit('');
  }

  // Filter methods
  toggleFilterDropdown() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  closeFilterDropdown() {
    this.showFilterDropdown = false;
  }

  toggleArrayFilter(array: string[], value: string) {
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(value);
    }
  }

  onGroupTypeChange(type: string) {
    this.toggleArrayFilter(this.activeFilters.groupType, type);
  }

  onVisibilityChange(visibility: string) {
    this.toggleArrayFilter(this.activeFilters.visibility, visibility);
  }

  onMemberCountChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.activeFilters.memberCount = target.value;
  }

  onCategoryChange(category: string) {
    this.toggleArrayFilter(this.activeFilters.category, category);
  }

  onDepartmentChange(department: string) {
    this.toggleArrayFilter(this.activeFilters.department, department);
  }

  onTagChange(tag: string) {
    this.toggleArrayFilter(this.activeFilters.tags, tag);
  }

  onCreatedDateChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.activeFilters.createdDate = target.value;
  }

  onSortByChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.activeFilters.sortBy = target.value;
  }

  onSortOrderChange() {
    this.activeFilters.sortOrder = this.activeFilters.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  applyFilters() {
    this.filter.emit(this.activeFilters);
    this.closeFilterDropdown();
  }

  clearFilters() {
    this.activeFilters = {
      groupType: [],
      visibility: [],
      memberCount: '',
      category: [],
      department: [],
      tags: [],
      createdDate: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.filter.emit(this.activeFilters);
  }

  getActiveFilterCount(): number {
    let count = 0;
    count += this.activeFilters.groupType.length;
    count += this.activeFilters.visibility.length;
    count += this.activeFilters.category.length;
    count += this.activeFilters.department.length;
    count += this.activeFilters.tags.length;
    if (this.activeFilters.memberCount) count++;
    if (this.activeFilters.createdDate) count++;
    return count;
  }

  isFilterActive(): boolean {
    return this.getActiveFilterCount() > 0;
  }

  // Label getters for filter pills
  getGroupTypeLabel(type: string): string {
    const option = this.groupTypes.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  getVisibilityLabel(visibility: string): string {
    const option = this.visibilityOptions.find(opt => opt.value === visibility);
    return option ? option.label : visibility;
  }

  getMemberCountLabel(memberCount: string): string {
    const option = this.memberCountOptions.find(opt => opt.value === memberCount);
    return option ? option.label : memberCount;
  }

  getCreatedDateLabel(createdDate: string): string {
    const option = this.createdDateOptions.find(opt => opt.value === createdDate);
    return option ? option.label : createdDate;
  }

  // Individual filter removal methods
  removeGroupTypeFilter(type: string): void {
    const index = this.activeFilters.groupType.indexOf(type);
    if (index > -1) {
      this.activeFilters.groupType.splice(index, 1);
      this.applyFilters();
    }
  }

  removeVisibilityFilter(visibility: string): void {
    const index = this.activeFilters.visibility.indexOf(visibility);
    if (index > -1) {
      this.activeFilters.visibility.splice(index, 1);
      this.applyFilters();
    }
  }

  removeMemberCountFilter(): void {
    this.activeFilters.memberCount = '';
    this.applyFilters();
  }

  removeCategoryFilter(category: string): void {
    const index = this.activeFilters.category.indexOf(category);
    if (index > -1) {
      this.activeFilters.category.splice(index, 1);
      this.applyFilters();
    }
  }

  removeDepartmentFilter(department: string): void {
    const index = this.activeFilters.department.indexOf(department);
    if (index > -1) {
      this.activeFilters.department.splice(index, 1);
      this.applyFilters();
    }
  }

  removeTagFilter(tag: string): void {
    const index = this.activeFilters.tags.indexOf(tag);
    if (index > -1) {
      this.activeFilters.tags.splice(index, 1);
      this.applyFilters();
    }
  }

  removeCreatedDateFilter(): void {
    this.activeFilters.createdDate = '';
    this.applyFilters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showFilterDropdown) {
      const target = event.target as HTMLElement
      const filterContainer = target.closest('.relative')
      if (!filterContainer) {
        this.closeFilterDropdown()
      }
    }
  }
} 