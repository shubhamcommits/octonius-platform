import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupTaskService, Task, TaskColumn, Board } from '../../../services/group-task.service';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-group-tasks',
  standalone: false,
  templateUrl: './group-tasks.component.html',
  styleUrl: './group-tasks.component.scss'
})
export class GroupTasksComponent implements OnInit, OnDestroy {
  board: Board | undefined;
  isLoading = false;
  group: WorkGroup | null = null;
  private groupSub: Subscription | null = null;
  
  // View state
  currentView: 'board' | 'list' | 'timeline' = 'board';
  
  // Sort and filter state
  sortBy: 'dueDate' | 'priority' | 'assignee' | 'created' = 'created';
  sortOrder: 'asc' | 'desc' = 'asc';
  filterStatus: string = 'all';
  filterAssignee: string = 'all';
  filterPriority: string = 'all';
  
  // UI state
  showAddTaskModal = false;
  showAddColumnModal = false;
  selectedColumn: any = null;
  selectedTask: Task | null = null;
  columnMenuOpen: { [key: string]: boolean } = {};
  
  // Form state
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  newTaskStatus: 'todo' | 'in_progress' | 'review' | 'done' = 'todo';
  newTaskDueDate = '';
  newTaskAssignee = '';
  newTaskColor = '#3B82F6';
  
  newColumnName = '';
  newColumnColor = '#757575';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private taskService: GroupTaskService,
    private workGroupService: WorkGroupService,
    private toastService: ToastService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe(group => {
      this.group = group;
      if (group) {
        this.loadBoard();
      }
    });
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
    if (view !== 'board') {
      this.toastService.info(`${view.charAt(0).toUpperCase() + view.slice(1)} view coming soon!`);
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
        tasks = tasks.filter(task => task.assigned_to === this.filterAssignee);
      }
      if (this.filterPriority !== 'all') {
        tasks = tasks.filter(task => task.priority === this.filterPriority);
      }

      // Apply sorting
      tasks.sort((a, b) => {
        let compareValue = 0;
        switch (this.sortBy) {
          case 'dueDate':
            compareValue = (a.due_date ? new Date(a.due_date).getTime() : Infinity) - 
                          (b.due_date ? new Date(b.due_date).getTime() : Infinity);
            break;
          case 'priority':
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          case 'assignee':
            compareValue = (a.assignee?.first_name || '').localeCompare(b.assignee?.first_name || '');
            break;
          case 'created':
            compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
        }
        return this.sortOrder === 'asc' ? compareValue : -compareValue;
      });

      column.tasks = tasks;
    });
  }

  // Column actions
  toggleColumnMenu(columnId: string): void {
    this.columnMenuOpen[columnId] = !this.columnMenuOpen[columnId];
  }

  editColumn(column: any): void {
    const newName = prompt('Edit column name:', column.name);
    if (newName && newName.trim() && this.group) {
      this.taskService.updateColumn(this.group.uuid, column.id, { name: newName.trim() }).subscribe({
        next: () => {
          column.name = newName.trim();
          this.toastService.success('Column updated successfully');
        },
        error: () => {
          this.toastService.error('Failed to update column');
        }
      });
    }
  }

  deleteColumn(column: any): void {
    if (!this.group) return;
    
    if (confirm(`Are you sure you want to delete the column "${column.name}"? All tasks will be deleted.`)) {
      this.taskService.deleteColumn(this.group.uuid, column.id).subscribe({
        next: () => {
          this.loadBoard();
          this.toastService.success('Column deleted successfully');
        },
        error: () => {
          this.toastService.error('Failed to delete column');
        }
      });
    }
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
    this.showAddTaskModal = true;
    this.resetTaskForm();
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.selectedColumn = null;
  }

  resetTaskForm(): void {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'medium';
    this.newTaskStatus = 'todo';
    this.newTaskDueDate = '';
    this.newTaskAssignee = '';
    this.newTaskColor = '#3B82F6';
  }

  createTask(): void {
    if (!this.group || !this.selectedColumn || !this.newTaskTitle.trim()) return;

    const taskData = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim() || undefined,
      column_id: this.selectedColumn.id,
      priority: this.newTaskPriority,
      status: this.newTaskStatus,
      color: this.newTaskColor,
      due_date: this.newTaskDueDate ? new Date(this.newTaskDueDate) : undefined,
      assigned_to: this.newTaskAssignee || undefined
    };

    this.taskService.createTask(this.group.uuid, taskData).subscribe({
      next: (task) => {
        // Add task to the column
        this.selectedColumn.tasks.push(task);
        this.closeAddTaskModal();
        this.toastService.success('Task created successfully');
      },
      error: () => {
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
}
