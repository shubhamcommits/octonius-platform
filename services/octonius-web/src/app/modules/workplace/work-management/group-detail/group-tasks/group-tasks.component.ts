import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupTaskService, Task, TaskColumn, Board } from '../../../services/group-task.service';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { CustomFieldService, GroupCustomFieldDefinition } from '../../../services/custom-field.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ModalService } from '../../../../../core/services/modal.service';
import { environment } from '../../../../../../environments/environment';
import { CreateTaskModalComponent } from './create-task-modal/create-task-modal.component';
import { RenameColumnModalComponent } from './rename-column-modal/rename-column-modal.component';
import { DeleteColumnModalComponent } from './delete-column-modal/delete-column-modal.component';
import { CustomFieldsSettingsModalComponent, CustomFieldsSettingsData } from './custom-fields-settings-modal/custom-fields-settings-modal.component';

@Component({
  selector: 'app-group-tasks',
  standalone: false,
  templateUrl: './group-tasks.component.html',
  styleUrl: './group-tasks.component.scss'
})
export class GroupTasksComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('boardContainer', { static: false }) boardContainer!: ElementRef;
  
  board: Board | undefined;
  isLoading = false;
  group: WorkGroup | null = null;
  private groupSub: Subscription | null = null;
  
  // Navigation arrow states
  canScrollLeft = false;
  canScrollRight = false;
  
  // View state
  currentView: 'board' | 'list' | 'timeline' = 'board';
  
  // Sort and filter state
  sortBy: 'dueDate' | 'priority' | 'assignee' | 'created' = 'created';
  sortOrder: 'asc' | 'desc' = 'asc';
  filterStatus: string = 'all';
  filterAssignee: string = 'all';
  filterPriority: string = 'all';
  
  // UI state
  showAddColumnModal = false;
  showDeleteModal = false;
  selectedColumn: any = null;
  selectedTask: Task | null = null;
  columnMenuOpen: { [key: string]: boolean } = {};
  
  // Column form state
  newColumnName = '';
  newColumnColor = '#757575';
  
  // Custom fields settings
  customFieldDefinitions: GroupCustomFieldDefinition[] = [];
  isLoadingCustomFields = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private taskService: GroupTaskService,
    private workGroupService: WorkGroupService,
    private customFieldService: CustomFieldService,
    private toastService: ToastService,
    private authService: AuthService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe(group => {
      this.group = group;
      if (group) {
        this.loadBoard();
      }
    });
  }

  ngAfterViewInit(): void {
    // Check scroll state after view is initialized
    setTimeout(() => {
      this.updateScrollState();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.groupSub) {
      this.groupSub.unsubscribe();
    }
  }

  loadBoard(): void {
    if (!this.group) return;
    
    this.isLoading = true;
    this.taskService.getBoard(this.group.uuid).subscribe({
      next: (board) => {
        this.board = board;
        this.applyFiltersAndSort();
        this.isLoading = false;
        
        // Load custom fields settings from group metadata
        this.loadCustomFieldsSettings();
        
        // Update scroll state after board is loaded
        setTimeout(() => {
          this.updateScrollState();
        }, 100);
      },
      error: (error) => {
        this.toastService.error('Failed to load task board');
        this.isLoading = false;
      }
    });
  }

  // View switching
  switchView(view: 'board' | 'list' | 'timeline'): void {
    this.currentView = view;
    if (view === 'timeline') {
      this.toastService.info('Timeline view coming soon!');
    }
  }

  showAutomatorInfo(): void {
    this.toastService.info('Automator coming soon!');
  }

  // Sorting functionality
  openSortMenu(): void {
    // In a real app, this would open a dropdown menu
    const sortOptions = ['Due Date', 'Priority', 'Assignee', 'Created Date'];
    this.toastService.info('Sort options: ' + sortOptions.join(', '));
  }

  sortTasks(sortBy: 'dueDate' | 'priority' | 'assignee' | 'created'): void {
    this.sortBy = sortBy;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSort();
  }

  // Filtering functionality
  openFilterMenu(): void {
    // In a real app, this would open a filter panel
    this.toastService.info('Filter options: Status, Assignee, Priority, Labels');
  }

  applyFiltersAndSort(): void {
    if (!this.board) return;

    // Apply filters and sorting to each column's tasks
    this.board.columns.forEach(column => {
      let tasks = [...column.tasks];

      // Apply filters
      if (this.filterStatus !== 'all') {
        tasks = tasks.filter(task => task.status === this.filterStatus);
      }
      if (this.filterAssignee !== 'all') {
        tasks = tasks.filter(task => 
          task.assignees && task.assignees.some(assignee => assignee.uuid === this.filterAssignee)
        );
      }
      if (this.filterPriority !== 'all') {
        tasks = tasks.filter(task => task.priority === this.filterPriority);
      }

      // Apply sorting - always sort by creation date (newest first), then by UUID for consistency
      tasks.sort((a, b) => {
        // First sort by creation date (newest first)
        const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (dateCompare !== 0) {
          return dateCompare;
        }
        
        // If creation dates are the same, sort by UUID for consistent ordering
        const uuidCompare = a.uuid.localeCompare(b.uuid);
        return uuidCompare;
      });

      column.tasks = tasks;
    });
  }

  // Column actions
  toggleColumnMenu(columnId: string, event: Event): void {
    event.stopPropagation();
    
    // Close all other menus first
    this.closeAllColumnMenus();
    
    // Toggle the clicked menu
    this.columnMenuOpen[columnId] = !this.columnMenuOpen[columnId];
  }

  closeAllColumnMenus(): void {
    this.columnMenuOpen = {};
  }

  openRenameModal(column: any): void {
    this.selectedColumn = column;
    this.modalService.openModal(RenameColumnModalComponent, {
      currentName: column.name,
      columnId: column.id,
      onCloseCallback: () => this.closeRenameModal(),
      onRenameCallback: (data: any) => this.onRenameColumn(data)
    });
    this.closeAllColumnMenus();
  }

  closeRenameModal(): void {
    this.modalService.closeModal();
    this.selectedColumn = null;
  }

  onRenameColumn(data: { columnId: string; newName: string }): void {
    if (!this.group) return;

    this.taskService.updateColumn(this.group.uuid, data.columnId, { 
      name: data.newName 
    }).subscribe({
      next: () => {
        if (this.selectedColumn) {
          this.selectedColumn.name = data.newName;
        }
        this.toastService.success('Column renamed successfully');
        this.closeRenameModal();
      },
      error: () => {
        this.toastService.error('Failed to rename column');
      }
    });
  }

  openDeleteModal(column: any): void {
    this.selectedColumn = column;
    this.showDeleteModal = true;
    this.closeAllColumnMenus();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedColumn = null;
  }

  onDeleteColumn(data: { columnId: string }): void {
    if (!this.group) return;

    this.taskService.deleteColumn(this.group.uuid, data.columnId).subscribe({
      next: () => {
        this.loadBoard();
        this.toastService.success('Column deleted successfully');
        this.closeDeleteModal();
      },
      error: () => {
        this.toastService.error('Failed to delete column');
      }
    });
  }

  // Add section (column)
  openAddSectionModal(): void {
    this.showAddColumnModal = true;
    this.newColumnName = '';
    this.newColumnColor = '#757575';
  }

  closeAddSectionModal(): void {
    this.showAddColumnModal = false;
  }

  createColumn(): void {
    if (!this.group || !this.newColumnName.trim()) return;

    this.taskService.createColumn(this.group.uuid, {
      name: this.newColumnName.trim(),
      color: this.newColumnColor
    }).subscribe({
      next: () => {
        this.loadBoard();
        this.closeAddSectionModal();
        this.toastService.success('Column created successfully');
      },
      error: () => {
        this.toastService.error('Failed to create column');
      }
    });
  }

  // Task actions
  openAddTaskModal(column: any): void {
    this.selectedColumn = column;
    
    // Ensure custom fields are loaded before opening modal
    this.loadCustomFieldsSettings();
    
    // Use a small delay to ensure the custom fields are loaded
    setTimeout(() => {
      this.modalService.openModal(CreateTaskModalComponent, {
        columnId: column.id,
        customFieldDefinitions: [...this.customFieldDefinitions], // Create a copy to ensure reactivity
        onClose: () => this.closeAddTaskModal(),
        onTaskCreated: (taskData: any) => this.onTaskCreated(taskData)
      });
    }, 100);
  }

  onTaskCreated(taskData: any): void {
    this.createTask(taskData);
  }

  closeAddTaskModal(): void {
    this.selectedColumn = null;
  }

  resetTaskForm(): void {
    this.selectedColumn = null;
  }

  createTask(taskData: any): void {
    if (!this.group || !this.selectedColumn) return;

    const taskPayload = {
      title: taskData.title.trim(),
      description: taskData.description?.trim() || undefined,
      column_id: this.selectedColumn.id,
      priority: taskData.priority,
      status: taskData.status,
      color: taskData.color,
      due_date: taskData.due_date ? new Date(taskData.due_date) : undefined,
      assigned_to: taskData.assigned_to || undefined,
      metadata: {
        custom_fields: taskData.customFields || {}
      }
    };

    this.taskService.createTask(this.group.uuid, taskPayload).subscribe({
      next: (task) => {
        // Find the column in the board and add the task
        if (this.board && this.board.columns) {
          const columnId = String(this.selectedColumn.id);
          const column = this.board.columns.find(col => String(col.id) === columnId);
          
          if (column) {
            // Ensure task has required arrays initialized
            if (!task.assignees) {
              task.assignees = [];
            }
            if (!task.labels) {
              task.labels = [];
            }
            if (!task.attachments) {
              task.attachments = [];
            }
            
            // Add task to the top and create new array reference to trigger change detection
            column.tasks = [task, ...column.tasks];
            
            // Force change detection
            this.cdr.detectChanges();
          }
        }
        this.closeAddTaskModal();
        this.toastService.success('Task created successfully');
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.toastService.error('Failed to create task');
      }
    });
  }

  markTaskAsDone(task: Task, event: Event): void {
    event.stopPropagation();
    if (!this.group) return;

    this.taskService.markTaskAsDone(this.group.uuid, task.uuid).subscribe({
      next: (updatedTask) => {
        task.status = 'done';
        task.completed_at = updatedTask.completed_at;
        this.toastService.success('Task marked as done');
      },
      error: () => {
        this.toastService.error('Failed to update task');
      }
    });
  }

  reopenTask(task: Task, event: Event): void {
    event.stopPropagation();
    if (!this.group) return;

    this.taskService.reopenTask(this.group.uuid, task.uuid).subscribe({
      next: () => {
        task.status = 'todo';
        task.completed_at = null;
        this.toastService.success('Task reopened');
      },
      error: () => {
        this.toastService.error('Failed to update task');
      }
    });
  }

  deleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    if (!this.group) return;

    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(this.group.uuid, task.uuid).subscribe({
        next: () => {
          this.loadBoard();
          this.toastService.success('Task deleted successfully');
        },
        error: () => {
          this.toastService.error('Failed to delete task');
        }
      });
    }
  }

  // Existing methods
  getDoneTasks(column: any): number {
    return column.tasks.filter((task: Task) => task.status === 'done').length;
  }

  onTaskClick(task: Task): void {
    this.router.navigate(['../tasks', task.uuid], { relativeTo: this.route });
  }

  // Add drag and drop functionality
  onTaskDrop(event: any, targetColumn: any): void {
    if (!this.group) return;
    
    const taskId = event.dataTransfer.getData('taskId');
    const sourceColumnId = event.dataTransfer.getData('columnId');
    
    if (sourceColumnId === targetColumn.id) return;
    
    // Find the task and its position
    const task = this.findTask(taskId);
    if (!task) return;
    
    // Calculate new position (add to end of column)
    const newPosition = targetColumn.tasks.length;
    
    // Optimistically update UI
    this.moveTaskInUI(taskId, sourceColumnId, targetColumn.id, newPosition);
    
    // Call API
    this.taskService.moveTask(this.group.uuid, taskId, {
      column_id: targetColumn.id,
      position: newPosition
    }).subscribe({
      next: (updatedTask) => {
        // Update succeeded, refresh the board to ensure consistency
        this.loadBoard();
      },
      error: (error) => {
        this.toastService.error('Failed to move task');
        // Revert the optimistic update
        this.loadBoard();
      }
    });
  }
  
  onDragStart(event: DragEvent, task: Task, columnId: string): void {
    event.dataTransfer!.setData('taskId', task.uuid);
    event.dataTransfer!.setData('columnId', columnId);
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
  
  private findTask(taskId: string): Task | null {
    if (!this.board) return null;
    
    for (const column of this.board.columns) {
      const task = column.tasks.find(t => t.uuid === taskId);
      if (task) return task;
    }
    return null;
  }
  
  private moveTaskInUI(taskId: string, sourceColumnId: string, targetColumnId: string, position: number): void {
    if (!this.board) return;
    
    const sourceColumn = this.board.columns.find(c => c.id === sourceColumnId);
    const targetColumn = this.board.columns.find(c => c.id === targetColumnId);
    
    if (!sourceColumn || !targetColumn) return;
    
    const taskIndex = sourceColumn.tasks.findIndex(t => t.uuid === taskId);
    if (taskIndex === -1) return;
    
    const [task] = sourceColumn.tasks.splice(taskIndex, 1);
    targetColumn.tasks.splice(position, 0, task);
  }

  isOverdue(dueDate: Date | string | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  getTaskBorderColor(task: Task): string {
    // Use status-based colors for better visual feedback
    switch (task.status) {
      case 'todo':
        return '#3B82F6'; // Blue
      case 'in_progress':
        return '#F59E0B'; // Amber
      case 'review':
        return '#8B5CF6'; // Purple
      case 'done':
        return '#10B981'; // Green
      default:
        return task.color || '#757575'; // Fallback to task color or gray
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  }

  getAllTasks(): Task[] {
    if (!this.board) return [];
    return this.board.columns.reduce((allTasks: Task[], column) => {
      return allTasks.concat(column.tasks);
    }, []);
  }

  // Helper method to get user avatar with fallback
  getUserAvatarUrl(user: any): string {
    return user?.avatar_url || environment.defaultAvatarUrl;
  }

  // Navigation arrow functionality
  scrollBoard(direction: 'left' | 'right'): void {
    if (!this.boardContainer) return;
    
    const container = this.boardContainer.nativeElement;
    const scrollAmount = 320; // Width of one column + gap
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    // Update scroll state after scrolling
    setTimeout(() => {
      this.updateScrollState();
    }, 100);
  }

  updateScrollState(): void {
    if (!this.boardContainer) return;
    
    const container = this.boardContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    this.canScrollLeft = scrollLeft > 0;
    this.canScrollRight = scrollLeft < maxScrollLeft - 1; // -1 for floating point precision
    
    this.cdr.detectChanges();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Update scroll state when window is resized
    setTimeout(() => {
      this.updateScrollState();
    }, 100);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close all column menus when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.column-menu-container')) {
      this.closeAllColumnMenus();
    }
  }

  // Custom Fields Settings
  openCustomFieldsSettings(): void {
    if (!this.group) return;

    this.modalService.openModal(CustomFieldsSettingsModalComponent, {
      groupId: this.group.uuid,
      onSave: (data: CustomFieldsSettingsData) => this.handleCustomFieldsSettingsSave(data),
      onCancel: () => this.modalService.closeModal()
    });
  }

  private handleCustomFieldsSettingsSave(data: CustomFieldsSettingsData): void {
    // The custom fields are already saved via the API in the modal component
    // Just update the local state
    this.customFieldDefinitions = data.customFields;
    this.toastService.success('Custom fields settings saved successfully');
    this.modalService.closeModal();
  }

  // Load custom fields settings from group metadata
  private loadCustomFieldsSettings(): void {
    if (!this.group) return;

    this.isLoadingCustomFields = true;
    // Use the new template endpoint for task creation
    this.customFieldService.getGroupTemplatesForTaskCreation(this.group.uuid).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customFieldDefinitions = response.data;
        }
        this.isLoadingCustomFields = false;
      },
      error: (error) => {
        console.error('Error loading custom field templates:', error);
        this.isLoadingCustomFields = false;
      }
    });
  }

  // Helper method to get custom field definitions for task creation
  getCustomFieldDefinitions(): GroupCustomFieldDefinition[] {
    return this.customFieldDefinitions;
  }
}
