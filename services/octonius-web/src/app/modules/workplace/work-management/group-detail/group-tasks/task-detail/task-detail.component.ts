import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupTaskService, Task } from '../../../../services/group-task.service';
import { TaskCommentService, TaskComment } from '../../../../services/task-comment.service';
import { WorkGroupService, WorkGroup } from '../../../../services/work-group.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';

@Component({
  selector: 'app-task-detail',
  standalone: false,
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();

  // Data
  group: WorkGroup | null = null;
  comments: TaskComment[] = [];
  currentUser: any = null;

  // Loading states
  isLoading = false;
  isLoadingComments = false;
  isSaving = false;
  isUpdatingStatus = false;

  // UI state
  activeTab: 'activity' | 'subtasks' | 'files' = 'activity';
  showEditModal = false;
  showDeleteModal = false;

  // Form data
  editForm = {
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    due_date: '',
    assigned_to: ''
  };

  // Comment form
  newComment = '';
  isSubmittingComment = false;

  // Subscriptions
  private routeSub: Subscription | null = null;
  private groupSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: GroupTaskService,
    private commentService: TaskCommentService,
    private workGroupService: WorkGroupService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Subscribe to group changes
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe((group: WorkGroup | null) => {
      this.group = group;
      if (group) {
        this.loadTaskFromRoute();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.groupSub) {
      this.groupSub.unsubscribe();
    }
  }

  private loadTaskFromRoute(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const taskId = params.get('taskId');
      if (taskId && this.group) {
        this.loadTask(taskId);
      }
    });
  }

  private loadTask(taskId: string): void {
    if (!this.group) return;

    this.isLoading = true;
    this.taskService.getTask(this.group.uuid, taskId).subscribe({
      next: (task: Task) => {
        this.task = task;
        this.populateEditForm();
        this.loadComments();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading task:', error);
        this.toastService.error('Failed to load task details');
        this.isLoading = false;
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }

  private loadComments(): void {
    if (!this.group || !this.task) return;

    this.isLoadingComments = true;
    this.commentService.getTaskComments(this.group.uuid, this.task.uuid).subscribe({
      next: (comments: TaskComment[]) => {
        this.comments = comments;
        this.isLoadingComments = false;
      },
      error: (error: any) => {
        console.error('Error loading comments:', error);
        this.comments = [];
        this.isLoadingComments = false;
      }
    });
  }

  private populateEditForm(): void {
    if (!this.task) return;

    this.editForm = {
      title: this.task.title,
      description: this.task.description || '',
      priority: this.task.priority,
      status: this.task.status,
      due_date: this.task.due_date ? new Date(this.task.due_date).toISOString().split('T')[0] : '',
      assigned_to: this.task.assigned_to || ''
    };
  }

  // Tab management
  switchTab(tab: 'activity' | 'subtasks' | 'files'): void {
    this.activeTab = tab;
    if (tab === 'subtasks') {
      this.toastService.info('Subtasks feature coming soon!');
    } else if (tab === 'files') {
      this.toastService.info('File attachments feature coming soon!');
    }
  }

  // Task status management
  updateTaskStatus(newStatus: 'todo' | 'in_progress' | 'review' | 'done'): void {
    if (!this.task || !this.group || this.task.status === newStatus) return;

    this.isUpdatingStatus = true;
    this.taskService.updateTask(this.group.uuid, this.task.uuid, { status: newStatus }).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.toastService.success(`Task status updated to ${this.getStatusLabel(newStatus)}`);
        this.isUpdatingStatus = false;
      },
      error: (error: any) => {
        console.error('Error updating task status:', error);
        this.toastService.error('Failed to update task status');
        this.isUpdatingStatus = false;
      }
    });
  }

  // Task priority management
  updateTaskPriority(newPriority: 'low' | 'medium' | 'high' | 'urgent'): void {
    if (!this.task || !this.group || this.task.priority === newPriority) return;

    this.taskService.updateTask(this.group.uuid, this.task.uuid, { priority: newPriority }).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.toastService.success(`Task priority updated to ${this.getPriorityLabel(newPriority)}`);
      },
      error: (error: any) => {
        console.error('Error updating task priority:', error);
        this.toastService.error('Failed to update task priority');
      }
    });
  }

  // Task editing
  openEditModal(): void {
    this.populateEditForm();
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveTask(): void {
    if (!this.task || !this.group || !this.editForm.title.trim()) return;

    this.isSaving = true;
    const updateData = {
      title: this.editForm.title.trim(),
      description: this.editForm.description.trim() || undefined,
      priority: this.editForm.priority,
      status: this.editForm.status,
      due_date: this.editForm.due_date ? new Date(this.editForm.due_date) : null,
      assigned_to: this.editForm.assigned_to || null
    };

    this.taskService.updateTask(this.group.uuid, this.task.uuid, updateData).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.closeEditModal();
        this.toastService.success('Task updated successfully');
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
        this.toastService.error('Failed to update task');
        this.isSaving = false;
      }
    });
  }

  // Task deletion
  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  deleteTask(): void {
    if (!this.task || !this.group) return;

    this.taskService.deleteTask(this.group.uuid, this.task.uuid).subscribe({
      next: () => {
        this.toastService.success('Task deleted successfully');
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (error: any) => {
        console.error('Error deleting task:', error);
        this.toastService.error('Failed to delete task');
        this.closeDeleteModal();
      }
    });
  }

  // Comments
  addComment(): void {
    if (!this.newComment.trim() || !this.group || !this.task) return;

    this.isSubmittingComment = true;
    this.commentService.createTaskComment(this.group.uuid, this.task.uuid, { content: this.newComment.trim() }).subscribe({
      next: (newComment: TaskComment) => {
        this.comments.push(newComment);
        this.newComment = '';
        this.toastService.success('Comment added successfully');
        this.isSubmittingComment = false;
      },
      error: (error: any) => {
        console.error('Error adding comment:', error);
        this.toastService.error('Failed to add comment');
        this.isSubmittingComment = false;
      }
    });
  }

  // Utility methods
  getUserDisplayName(user: any): string {
    if (!user) return 'Unknown User';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Unknown User';
  }

  getUserInitials(user: any): string {
    if (!user) return 'U';
    if (user.first_name || user.last_name) {
      return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`;
    }
    return (user.email?.charAt(0) || 'U').toUpperCase();
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'todo':
        return 'btn-info';
      case 'in_progress':
        return 'btn-warning';
      case 'review':
        return 'btn-secondary';
      case 'done':
        return 'btn-success';
      default:
        return 'btn-ghost';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'urgent':
        return 'Urgent';
      default:
        return priority;
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low':
        return '#10B981'; // Green
      case 'medium':
        return '#F59E0B'; // Amber
      case 'high':
        return '#EF4444'; // Red
      case 'urgent':
        return '#DC2626'; // Dark red
      default:
        return '#6B7280'; // Gray
    }
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString();
  }

  isOverdue(dueDate: Date | string | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  onClose(): void {
    this.close.emit();
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
