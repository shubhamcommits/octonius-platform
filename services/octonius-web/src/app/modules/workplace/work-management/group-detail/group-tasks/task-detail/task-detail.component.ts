import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { GroupTaskService, Task, GroupMember } from '../../../../services/group-task.service';
import { TaskCommentService, TaskComment } from '../../../../services/task-comment.service';
import { WorkGroupService, WorkGroup } from '../../../../services/work-group.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { ModalService } from '../../../../../../core/services/modal.service';
import { AssigneeModalComponent, AssigneeData } from './assignee-modal/assignee-modal.component';
import { TiptapEditorComponent } from '../../../../../../core/components/tiptap-editor/tiptap-editor.component';
import { CustomFieldModalComponent, CustomFieldData } from './custom-field-modal/custom-field-modal.component';
import { TimeEntryModalComponent, TimeEntryData } from './time-entry-modal/time-entry-modal.component';
import { environment } from '../../../../../../../environments/environment';

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
  groupMembers: GroupMember[] = [];

  // Loading states
  isLoading = false;
  isLoadingComments = false;
  isLoadingMembers = false;
  isUpdatingStatus = false;
  isAddingTimeEntry = false;
  isUpdatingCustomFields = false;
  isSaving = false;

  // UI state
  activeTab: 'activity' | 'subtasks' | 'files' | 'time' = 'activity';
  showDeleteModal = false;
  showAssigneeModal = false;

  // Live editing data
  liveEditData = {
    title: '',
    description: ''
  };

  // Debounced saving
  private saveSubject = new Subject<{ title?: string; description?: string }>();
  private saveSubscription: Subscription | null = null;

  // Assignee form
  assigneeForm = {
    selectedUserIds: [] as string[]
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
    private authService: AuthService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Setup debounced saving
    this.saveSubscription = this.saveSubject
      .pipe(
        debounceTime(1000), // 1 second delay
        distinctUntilChanged()
      )
      .subscribe(changes => {
        this.saveChanges(changes);
      });
    
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
    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
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

    this.liveEditData = {
      title: this.task.title,
      description: this.task.description || ''
    };
  }

  // Live editing methods
  onTitleChange(title: string): void {
    this.liveEditData.title = title;
    this.saveSubject.next({ title });
  }

  onDescriptionChange(newDescription: string): void {
    this.liveEditData.description = newDescription;
    this.saveSubject.next({ description: newDescription });
  }

  saveChanges(changes: { title?: string; description?: string }): void {
    if (!this.task || !this.group) return;

    this.isSaving = true;
    const updateData: any = {
      title: changes.title || this.task.title,
      priority: this.task.priority,
      status: this.task.status,
      due_date: this.task.due_date ? new Date(this.task.due_date) : null,
      estimated_hours: this.task.metadata?.estimated_hours || 0
    };

    // Handle description properly
    if (changes.description !== undefined) {
      updateData.description = changes.description || undefined;
    } else {
      updateData.description = this.task.description || undefined;
    }

    this.taskService.updateTask(this.group.uuid, this.task.uuid, updateData).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.isSaving = false;
        this.toastService.success('Task updated successfully');
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

  // Assignee management
  openAssigneeModal(): void {
    this.populateAssigneeForm();
    this.loadGroupMembersAndOpenModal();
    this.showAssigneeModal = true; // Show loading state
  }

  private loadGroupMembersAndOpenModal(): void {
    if (!this.group) return;

    this.isLoadingMembers = true;
    this.taskService.getGroupMembers(this.group.uuid).subscribe({
      next: (members: GroupMember[]) => {
        this.groupMembers = members;
        this.isLoadingMembers = false;
        
        // Open modal after members are loaded
        this.modalService.openModal(AssigneeModalComponent, {
          assigneeData: {
            selectedUserIds: this.assigneeForm.selectedUserIds,
            groupMembers: this.groupMembers
          },
          onSave: (selectedUserIds: string[]) => this.saveAssigneesWithData(selectedUserIds),
          onCancel: () => this.closeAssigneeModal()
        });
        this.showAssigneeModal = false; // Hide loading state
      },
      error: (error: any) => {
        console.error('Error loading group members:', error);
        this.toastService.error('Failed to load group members');
        this.isLoadingMembers = false;
        this.showAssigneeModal = false; // Hide loading state on error
      }
    });
  }

  closeAssigneeModal(): void {
    this.modalService.closeModal();
  }

  private saveAssigneesWithData(selectedUserIds: string[]): void {
    this.assigneeForm.selectedUserIds = selectedUserIds;
    this.saveAssignees();
  }



  private populateAssigneeForm(): void {
    if (!this.task) return;
    this.assigneeForm.selectedUserIds = this.task.assignees?.map(assignee => assignee.uuid) || [];
  }

  saveAssignees(): void {
    if (!this.task || !this.group) return;

    this.taskService.assignUsersToTask(this.group.uuid, this.task.uuid, this.assigneeForm.selectedUserIds).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.closeAssigneeModal();
        this.toastService.success('Assignees updated successfully');
      },
      error: (error: any) => {
        console.error('Error updating assignees:', error);
        this.toastService.error('Failed to update assignees');
      }
    });
  }

  toggleAssignee(userId: string, event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.assigneeForm.selectedUserIds.includes(userId)) {
        this.assigneeForm.selectedUserIds.push(userId);
      }
    } else {
      this.assigneeForm.selectedUserIds = this.assigneeForm.selectedUserIds.filter(id => id !== userId);
    }
  }

  removeAssignee(userId: string): void {
    if (!this.task || !this.group) return;

    const updatedUserIds = this.task.assignees?.filter(assignee => assignee.uuid !== userId).map(assignee => assignee.uuid) || [];
    
    this.taskService.assignUsersToTask(this.group.uuid, this.task.uuid, updatedUserIds).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.toastService.success('Assignee removed successfully');
      },
      error: (error: any) => {
        console.error('Error removing assignee:', error);
        this.toastService.error('Failed to remove assignee');
      }
    });
  }

  // Time tracking
  openTimeEntryModal(): void {
    this.modalService.openModal(TimeEntryModalComponent, {
      onSave: (data: TimeEntryData) => this.handleTimeEntrySave(data),
      onCancel: () => this.modalService.closeModal()
    });
  }

  private handleTimeEntrySave(data: TimeEntryData): void {
    if (!this.task || !this.group) return;

    this.isAddingTimeEntry = true;
    const timeData = {
      hours: data.hours,
      description: data.description,
      date: new Date(data.date)
    };

    this.taskService.addTimeEntry(this.group.uuid, this.task.uuid, timeData).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.modalService.closeModal();
        this.toastService.success('Time entry added successfully');
        this.isAddingTimeEntry = false;
      },
      error: (error: any) => {
        console.error('Error adding time entry:', error);
        this.toastService.error('Failed to add time entry');
        this.isAddingTimeEntry = false;
      }
    });
  }

  // Custom fields
  openCustomFieldsModal(): void {
    this.modalService.openModal(CustomFieldModalComponent, {
      onSave: (data: CustomFieldData) => this.handleCustomFieldSave(data),
      onCancel: () => this.modalService.closeModal()
    });
  }

  private handleCustomFieldSave(data: CustomFieldData): void {
    if (!this.task || !this.group) return;

    this.isUpdatingCustomFields = true;
    const customFields: Record<string, string> = {
      ...(this.task.metadata?.custom_fields || {}),
      [data.fieldName]: data.fieldValue
    };

    this.taskService.updateCustomFields(this.group.uuid, this.task.uuid, customFields).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.modalService.closeModal();
        this.toastService.success('Custom field added successfully');
        this.isUpdatingCustomFields = false;
      },
      error: (error: any) => {
        console.error('Error updating custom fields:', error);
        this.toastService.error('Failed to add custom field');
        this.isUpdatingCustomFields = false;
      }
    });
  }

  removeCustomField(fieldName: string): void {
    if (!this.task || !this.group) return;

    // Show loading state (optional)
    console.log('Removing custom field:', fieldName);
    console.log('Current custom fields:', this.task.metadata?.custom_fields);

    const customFields: Record<string, string> = { ...(this.task.metadata?.custom_fields || {}) };
    delete customFields[fieldName];

    console.log('Updated custom fields to send:', customFields);

    this.taskService.updateCustomFields(this.group.uuid, this.task.uuid, customFields).subscribe({
      next: (updatedTask: Task) => {
        console.log('Updated task received:', updatedTask);
        this.task = updatedTask;
        // Force change detection to ensure UI updates
        this.cdr.detectChanges();
        this.toastService.success(`${fieldName} field removed successfully`);
      },
      error: (error: any) => {
        console.error('Error removing custom field:', error);
        this.toastService.error(`Failed to remove ${fieldName} field`);
      }
    });
  }

  // Helper method to get custom field value safely
  getCustomFieldValue(field: string): string {
    return this.task?.metadata?.custom_fields?.[field] || '';
  }

  // Helper method to get all custom fields that exist
  getCustomFields(): { [key: string]: string } {
    return this.task?.metadata?.custom_fields || {};
  }

  // Helper method to check if custom fields exist
  hasCustomFields(): boolean {
    const customFields = this.getCustomFields();
    return Object.keys(customFields).length > 0;
  }

  // Helper method to get custom field entries as array for iteration
  getCustomFieldEntries(): { key: string; value: string }[] {
    const customFields = this.getCustomFields();
    return Object.entries(customFields).map(([key, value]) => ({ key, value }));
  }

  // TrackBy function for custom fields to improve change detection
  trackByFieldKey(index: number, field: { key: string; value: string }): string {
    return field.key;
  }

  // Generate a beautiful color for a custom field based on field name
  getCustomFieldColor(fieldName: string): string {
    // Beautiful color palette for custom fields
    const colors = [
      '#6366F1', // Indigo
      '#8B5CF6', // Violet  
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#8B5A2B', // Brown
      '#6B7280', // Gray
      '#84CC16', // Lime
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#A855F7', // Purple
      '#14B8A6', // Teal
      '#F43F5E', // Rose
      '#22D3EE', // Sky
      '#65A30D', // Green
      '#DC2626', // Red-600
      '#7C3AED', // Violet-600
      '#DB2777'  // Pink-600
    ];

    // Simple hash function to get consistent color for same field name
    let hash = 0;
    for (let i = 0; i < fieldName.length; i++) {
      const char = fieldName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and modulo to get color index
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  }

  // Get lighter version of the color for background
  getCustomFieldBackgroundColor(fieldName: string): string {
    const baseColor = this.getCustomFieldColor(fieldName);
    // Convert hex to RGB and add transparency
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  }

  // Helper method to get user avatar with fallback
  getUserAvatarUrl(user: any): string {
    return user?.avatar_url || environment.defaultAvatarUrl;
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

  // Tab management
  switchTab(tab: 'activity' | 'subtasks' | 'files' | 'time'): void {
    this.activeTab = tab;
    if (tab === 'subtasks') {
      this.toastService.info('Subtasks feature coming soon!');
    } else if (tab === 'files') {
      this.toastService.info('File attachments feature coming soon!');
    } else if (tab === 'time') {
      this.toastService.info('Time tracking feature coming soon!');
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

  // Task due date management
  openDatePicker(): void {
    // Create a temporary input element to trigger the native date picker
    const input = document.createElement('input');
    input.type = 'date';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    
    // Set current due date if it exists
    if (this.task?.due_date) {
      const date = new Date(this.task.due_date);
      input.value = date.toISOString().split('T')[0];
    }
    
    document.body.appendChild(input);
    
    input.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.value) {
        this.updateTaskDueDate(new Date(target.value));
      }
      document.body.removeChild(input);
    });
    
    input.addEventListener('blur', () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    });
    
    input.click();
  }

  updateTaskDueDate(newDueDate: Date): void {
    if (!this.task || !this.group) return;
    
    this.taskService.updateTask(this.group.uuid, this.task.uuid, { due_date: newDueDate }).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.toastService.success('Due date updated successfully');
      },
      error: (error: any) => {
        console.error('Error updating task due date:', error);
        this.toastService.error('Failed to update due date');
      }
    });
  }
}
