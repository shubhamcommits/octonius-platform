import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { GroupTaskService, Task, GroupMember } from '../../../../services/group-task.service';
import { TaskCommentService, TaskComment } from '../../../../services/task-comment.service';
import { WorkGroupService, WorkGroup } from '../../../../services/work-group.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { ModalService } from '../../../../../../core/services/modal.service';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { AssigneeModalComponent } from './assignee-modal/assignee-modal.component';
import { CustomFieldModalComponent, CustomFieldData } from './custom-field-modal/custom-field-modal.component';
import { CustomFieldService, GroupCustomFieldDefinition, TaskCustomField, CreateTaskCustomFieldData } from '../../../../services/custom-field.service';
import { TimeEntryModalComponent, TimeEntryData } from './time-entry-modal/time-entry-modal.component';
import { DatePickerModalComponent } from './date-picker-modal/date-picker-modal.component';

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
  groupFieldDefinitions: GroupCustomFieldDefinition[] = [];
  taskCustomFields: TaskCustomField[] = [];

  // Loading states
  isLoading = false;
  isLoadingComments = false;
  isLoadingMembers = false;
  isUpdatingStatus = false;
  isAddingTimeEntry = false;
  isUpdatingCustomFields = false;
  isSaving = false;
  isUpdatingEstimatedHours = false;

  // UI state
  activeTab: 'activity' | 'subtasks' | 'files' | 'time' = 'activity';
  showDeleteModal = false;
  showAssigneeModal = false;
  isEditingEstimatedHours = false;
  estimatedHoursInput = 0;
  estimatedHoursError = '';

  // Tiptap editor configuration
  editorConfig = {
    placeholder: 'Add a comment...',
    showToolbar: true,
    showBubbleMenu: true,
    showCharacterCount: false,
    maxHeight: '200px',
    minHeight: '100px',
    readOnly: false,
    toolbarItems: ['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'link'],
    enableImageUpload: false,
    enableEmojiPicker: false,
    enableTableControls: false,
    sourceContext: 'task-comment',
    enableMentions: true,
    groupId: undefined as string | undefined,
    workplaceId: undefined as string | undefined
  };

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
    private customFieldService: CustomFieldService,
    private toastService: ToastService,
    private authService: AuthService,
    private modalService: ModalService,
    private dialogService: DialogService,
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
        // Update editor config with group context for mentions
        this.editorConfig.groupId = group.uuid;
        // Get workplace ID from current user context
        if (this.currentUser?.current_workplace_id) {
          this.editorConfig.workplaceId = this.currentUser.current_workplace_id;
        }
        this.loadGroupFieldDefinitions();
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
        // Use custom fields from task object instead of separate API call
        if (task.custom_fields) {
          this.taskCustomFields = task.custom_fields;
        } else {
          this.loadTaskCustomFields();
        }
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
    
    // Open modal directly - it will handle loading members internally
    this.modalService.openModal(AssigneeModalComponent, {
      assigneeData: {
        selectedUserIds: this.assigneeForm.selectedUserIds,
        groupId: this.group.uuid
      },
      onSave: (selectedUserIds: string[]) => this.saveAssigneesWithData(selectedUserIds),
      onCancel: () => this.closeAssigneeModal()
    });
    this.showAssigneeModal = false; // Hide loading state
    this.isLoadingMembers = false;
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
    if (!this.task) return;

    this.modalService.openModal(CustomFieldModalComponent, {
      groupFieldDefinitions: this.groupFieldDefinitions,
      taskCustomFields: this.taskCustomFields,
      onSave: (data: CustomFieldData) => this.handleCustomFieldSave(data),
      onCancel: () => this.modalService.closeModal()
    });
  }

  private handleCustomFieldSave(data: CustomFieldData): void {
    if (!this.task) return;

    this.isUpdatingCustomFields = true;
    
    const fieldData: CreateTaskCustomFieldData = {
      field_definition_id: data.field_definition_id,
      field_name: data.field_name,
      field_value: data.field_value,
      field_type: data.field_type,
      is_group_field: data.is_group_field
    };

    this.customFieldService.upsertTaskCustomField(this.task.uuid, fieldData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadTaskCustomFields();
          this.modalService.closeModal();
          this.toastService.success('Custom field saved successfully');
        } else {
          this.toastService.error(response.message || 'Failed to save custom field');
        }
        this.isUpdatingCustomFields = false;
      },
      error: (error: any) => {
        console.error('Error saving custom field:', error);
        this.toastService.error('Failed to save custom field');
        this.isUpdatingCustomFields = false;
      }
    });
  }

  removeCustomField(fieldId: string): void {
    if (!this.task) return;

    this.isUpdatingCustomFields = true;

    // Find the task custom field to remove
    const taskField = this.taskCustomFields.find(tf => tf.uuid === fieldId);
    if (!taskField) {
      this.toastService.error('Custom field not found');
      this.isUpdatingCustomFields = false;
      return;
    }

    this.customFieldService.deleteTaskCustomField(fieldId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadTaskCustomFields();
          this.toastService.success('Custom field removed successfully');
        } else {
          this.toastService.error(response.message || 'Failed to remove custom field');
        }
        this.isUpdatingCustomFields = false;
      },
      error: (error: any) => {
        console.error('Error removing custom field:', error);
        this.toastService.error('Failed to remove custom field');
        this.isUpdatingCustomFields = false;
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

  // Helper method to get custom field definitions from group metadata
  getCustomFieldDefinitions(): any[] {
    if (!this.group?.metadata) return [];
    return (this.group.metadata as any).custom_fields_settings || [];
  }

  // Helper method to check if custom fields exist
  hasCustomFields(): boolean {
    const customFieldEntries = this.getCustomFieldEntries();
    return customFieldEntries.length > 0;
  }

  // Load group field definitions
  private loadGroupFieldDefinitions(): void {
    if (!this.group) return;

    this.customFieldService.getGroupTemplatesForTaskCreation(this.group.uuid).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.groupFieldDefinitions = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading group field definitions:', error);
      }
    });
  }

  // Load task custom fields
  private loadTaskCustomFields(): void {
    if (!this.task) return;

    this.customFieldService.getTaskCustomFields(this.task.uuid).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.taskCustomFields = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading task custom fields:', error);
      }
    });
  }

  // Helper method to get custom field entries as array for iteration
  getCustomFieldEntries(): { key: string; value: string; displayName: string; isGroupField: boolean; isTaskField: boolean; fieldType: string; fieldDefinitionId?: string }[] {
    const allFields: { key: string; value: string; displayName: string; isGroupField: boolean; isTaskField: boolean; fieldType: string; fieldDefinitionId?: string }[] = [];
    
    // Process all task custom fields (both group fields and task-specific fields)
    this.taskCustomFields.forEach(taskField => {
      if (taskField.is_group_field && taskField.field_definition_id) {
        // This is a group field - use the field definition that comes with the task field
        const fieldDef = (taskField as any).fieldDefinition;
        if (fieldDef) {
          allFields.push({
            key: taskField.uuid, // Use task field UUID as key to avoid duplicates
            value: taskField.field_value,
            displayName: fieldDef.name,
            isGroupField: true,
            isTaskField: true,
            fieldType: fieldDef.type,
            fieldDefinitionId: fieldDef.uuid
          });
        } else {
          // Fallback: try to find in group field definitions
          const fieldDef = this.groupFieldDefinitions.find(fd => fd.uuid === taskField.field_definition_id);
          if (fieldDef) {
            allFields.push({
              key: taskField.uuid,
              value: taskField.field_value,
              displayName: fieldDef.name,
              isGroupField: true,
              isTaskField: true,
              fieldType: fieldDef.type,
              fieldDefinitionId: fieldDef.uuid
            });
          }
        }
      } else if (!taskField.is_group_field) {
        // This is a task-specific field
        allFields.push({
          key: taskField.uuid,
          value: taskField.field_value,
          displayName: taskField.field_name,
          isGroupField: false,
          isTaskField: true,
          fieldType: taskField.field_type
        });
      }
    });
    
    return allFields;
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
  getAvatarUrl(user: any): string | null {
    return user?.avatar_url || null;
  }

  getUserInitials(user: any): string {
    if (!user) return 'U';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  // Utility methods
  getUserDisplayName(user: any): string {
    if (!user) return 'Unknown User';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Unknown User';
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
    console.log('=== FORMAT DATE CALL ===');
    console.log('Input date:', date);
    console.log('Input date type:', typeof date);
    console.log('Input date stringified:', JSON.stringify(date));
    
    if (!date) {
      console.log('No date provided, returning "No date set"');
      return 'No date set';
    }
    
    const dateObj = new Date(date);
    console.log('Created Date object:', dateObj);
    console.log('Date object toDateString:', dateObj.toDateString());
    console.log('Date object toISOString:', dateObj.toISOString());
    
    const formattedDate = dateObj.toLocaleDateString();
    console.log('Final formatted date:', formattedDate);
    console.log('=== FORMAT DATE END ===');
    return formattedDate;
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
    }
    // Time tracking tab is now fully implemented
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
    console.log('=== OPEN DATE PICKER START ===');
    console.log('Current task:', this.task);
    console.log('Current task due_date:', this.task?.due_date);
    console.log('Current task due_date type:', typeof this.task?.due_date);
    
    // Ensure the current date is properly formatted
    let currentDate = null;
    if (this.task?.due_date) {
      const dueDate = new Date(this.task.due_date);
      console.log('Parsed dueDate:', dueDate);
      console.log('dueDate toDateString:', dueDate.toDateString());
      console.log('dueDate toISOString:', dueDate.toISOString());
      
      // Create a date string in YYYY-MM-DD format for the date picker
      currentDate = dueDate.toISOString().split('T')[0];
      console.log('Formatted currentDate for modal:', currentDate);
    }
    
    console.log('Final currentDate being passed to modal:', currentDate);
    
    this.modalService.openModal(DatePickerModalComponent, {
      currentDate: currentDate,
      onSave: (date: Date | null) => {
        this.updateTaskDueDate(date);
        this.modalService.closeModal();
      },
      onCancel: () => {
        this.modalService.closeModal();
      }
    });
    
    console.log('=== OPEN DATE PICKER END ===');
  }

  updateTaskDueDate(newDueDate: Date | null): void {
    console.log('=== UPDATE TASK DUE DATE START ===');
    console.log('Input newDueDate:', newDueDate);
    console.log('Input newDueDate type:', typeof newDueDate);
    console.log('Input newDueDate stringified:', JSON.stringify(newDueDate));
    
    if (!this.task || !this.group) {
      console.log('No task or group, returning');
      return;
    }
    
    console.log('Current task due_date before update:', this.task.due_date);
    console.log('Task ID:', this.task.uuid);
    console.log('Group ID:', this.group.uuid);
    
    // Check if the date is actually different from the current date
    const currentDueDate = this.task.due_date ? new Date(this.task.due_date) : null;
    const isDateDifferent = !currentDueDate && !newDueDate ? false : 
                           !currentDueDate || !newDueDate ? true :
                           currentDueDate.getTime() !== newDueDate.getTime();
    
    console.log('Current due date:', currentDueDate);
    console.log('New due date:', newDueDate);
    console.log('Is date different:', isDateDifferent);
    
    if (!isDateDifferent) {
      console.log('Date is the same, no update needed');
      return;
    }
    
    // Format the date properly for the backend
    let formattedDate = null;
    if (newDueDate) {
      // Create a date string in YYYY-MM-DD format to avoid timezone issues
      const year = newDueDate.getFullYear();
      const month = String(newDueDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDueDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Create a new Date object from the string to ensure consistency
      formattedDate = new Date(dateString + 'T00:00:00.000Z');
      
      console.log('Original date:', newDueDate);
      console.log('Date string:', dateString);
      console.log('Formatted date for API:', formattedDate);
      console.log('Formatted date ISO string:', formattedDate.toISOString());
      console.log('Formatted date toDateString:', formattedDate.toDateString());
    }
    
    // Send the formatted Date object to the API
    console.log('Date object being sent to API:', formattedDate);
    console.log('Date object type:', typeof formattedDate);
    console.log('Date object stringified:', JSON.stringify(formattedDate));
    
    this.taskService.updateTask(this.group.uuid, this.task.uuid, { due_date: formattedDate }).subscribe({
      next: (updatedTask: Task) => {
        console.log('=== TASK UPDATE RESPONSE ===');
        console.log('Updated task:', updatedTask);
        console.log('Updated task due_date:', updatedTask.due_date);
        console.log('Updated task due_date type:', typeof updatedTask.due_date);
        console.log('Updated task due_date stringified:', JSON.stringify(updatedTask.due_date));
        
        // Check if the date changed unexpectedly
        if (formattedDate && updatedTask.due_date) {
          const sentDate = new Date(formattedDate);
          const receivedDate = new Date(updatedTask.due_date);
          console.log('Sent date:', sentDate.toDateString());
          console.log('Received date:', receivedDate.toDateString());
          console.log('Dates match:', sentDate.toDateString() === receivedDate.toDateString());
        }
        
        this.task = updatedTask;
        console.log('Task object updated, new due_date:', this.task.due_date);
        this.toastService.success(formattedDate ? 'Due date updated successfully' : 'Due date removed successfully');
        console.log('=== UPDATE TASK DUE DATE END ===');
      },
      error: (error: any) => {
        console.error('Error updating task due date:', error);
        this.toastService.error('Failed to update due date');
      }
    });
  }

  // Time tracking methods
  getTimeEntries(): Array<{ user_id: string; hours: number; description?: string; date: Date }> {
    return this.task?.metadata?.time_entries || [];
  }

  getTotalTimeTracked(): number {
    const entries = this.getTimeEntries();
    return entries.reduce((total, entry) => total + entry.hours, 0);
  }

  getEstimatedHours(): number {
    return this.task?.metadata?.estimated_hours || 0;
  }

  getTimeDifference(): number {
    const total = this.getTotalTimeTracked();
    const estimated = this.getEstimatedHours();
    return Math.abs(total - estimated);
  }

  getTimeTrackingStatus(): 'under' | 'over' | 'exact' {
    const total = this.getTotalTimeTracked();
    const estimated = this.getEstimatedHours();
    
    if (estimated === 0) return 'exact';
    if (total < estimated) return 'under';
    if (total > estimated) return 'over';
    return 'exact';
  }

  // Utility functions for time formatting
  formatTimeDisplay(hours: number): string {
    if (hours === 0) return '0h';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    } else if (wholeHours === 0) {
      return `${minutes}m`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  }

  formatTimeEntryHours(hours: number): string {
    return this.formatTimeDisplay(hours);
  }

  getUserById(userId: string): any {
    // First check if it's the current user
    if (this.currentUser && this.currentUser.uuid === userId) {
      return this.currentUser;
    }
    
    // Then check group members
    const member = this.groupMembers.find(member => member.uuid === userId);
    if (member) {
      return member;
    }
    
    // Return a fallback user object
    return {
      uuid: userId,
      first_name: 'Unknown',
      last_name: 'User',
      avatar_url: null
    };
  }

  formatTimeEntryDate(date: Date | string): string {
    if (!date) return 'Unknown date';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByTimeEntry(index: number, entry: any): string {
    return `${entry.user_id}-${entry.date}-${entry.hours}`;
  }

  // Estimated hours editing methods
  toggleEstimatedHoursEdit(): void {
    this.isEditingEstimatedHours = !this.isEditingEstimatedHours;
    if (this.isEditingEstimatedHours) {
      this.estimatedHoursInput = this.task?.metadata?.estimated_hours || 0;
      this.estimatedHoursError = '';
    }
  }

  cancelEstimatedHoursEdit(): void {
    this.isEditingEstimatedHours = false;
    this.estimatedHoursInput = 0;
    this.estimatedHoursError = '';
  }

  saveEstimatedHours(): void {
    if (!this.task || !this.group) return;

    // Validate input
    this.estimatedHoursError = '';
    if (this.estimatedHoursInput < 0) {
      this.estimatedHoursError = 'Estimated hours cannot be negative';
      return;
    }

    if (this.estimatedHoursInput > 9999) {
      this.estimatedHoursError = 'Estimated hours cannot exceed 9999';
      return;
    }

    this.isUpdatingEstimatedHours = true;

    // Update the task with new estimated hours
    this.taskService.updateTask(this.group.uuid, this.task.uuid, {
      metadata: {
        ...this.task.metadata,
        estimated_hours: this.estimatedHoursInput || undefined
      }
    }).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.isEditingEstimatedHours = false;
        this.estimatedHoursInput = 0;
        this.toastService.success('Estimated hours updated successfully');
      },
      error: (error: any) => {
        console.error('Error updating estimated hours:', error);
        this.estimatedHoursError = error.message || 'Failed to update estimated hours';
        this.toastService.error(this.estimatedHoursError);
      },
      complete: () => {
        this.isUpdatingEstimatedHours = false;
      }
    });
  }

  editTimeEntry(entry: any): void {
    if (!this.task || !this.group) return;

    // Find the index of the time entry
    const timeEntries = this.getTimeEntries();
    const timeEntryIndex = timeEntries.findIndex(e => 
      e.user_id === entry.user_id && 
      e.hours === entry.hours && 
      e.date === entry.date
    );

    if (timeEntryIndex === -1) {
      this.toastService.error('Time entry not found');
      return;
    }

    // Open the time entry modal with pre-filled data
    this.modalService.openModal(TimeEntryModalComponent, {
      initialData: {
        hours: entry.hours,
        description: entry.description || '',
        date: new Date(entry.date).toISOString().split('T')[0]
      },
      onSave: (data: TimeEntryData) => this.handleTimeEntryUpdate(timeEntryIndex, data),
      onCancel: () => this.modalService.closeModal()
    });
  }

  deleteTimeEntry(entry: any): void {
    if (!this.task || !this.group) return;

    // Find the index of the time entry
    const timeEntries = this.getTimeEntries();
    const timeEntryIndex = timeEntries.findIndex(e => 
      e.user_id === entry.user_id && 
      e.hours === entry.hours && 
      e.date === entry.date
    );

    if (timeEntryIndex === -1) {
      this.toastService.error('Time entry not found');
      return;
    }

    // Show confirmation dialog using platform's dialog service
    this.dialogService.confirm({
      title: 'Delete Time Entry',
      message: 'Are you sure you want to delete this time entry? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      icon: 'AlertTriangle'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTimeEntry(this.group!.uuid, this.task!.uuid, timeEntryIndex).subscribe({
          next: (updatedTask: Task) => {
            this.task = updatedTask;
            this.toastService.success('Time entry deleted successfully');
          },
          error: (error: any) => {
            console.error('Error deleting time entry:', error);
            this.toastService.error('Failed to delete time entry');
          }
        });
      }
    });
  }

  private handleTimeEntryUpdate(timeEntryIndex: number, data: TimeEntryData): void {
    if (!this.task || !this.group) return;

    this.isAddingTimeEntry = true;
    const timeData = {
      hours: data.hours,
      description: data.description,
      date: new Date(data.date)
    };

    this.taskService.updateTimeEntry(this.group.uuid, this.task.uuid, timeEntryIndex, timeData).subscribe({
      next: (updatedTask: Task) => {
        this.task = updatedTask;
        this.modalService.closeModal();
        this.toastService.success('Time entry updated successfully');
        this.isAddingTimeEntry = false;
      },
      error: (error: any) => {
        console.error('Error updating time entry:', error);
        this.toastService.error('Failed to update time entry');
        this.isAddingTimeEntry = false;
      }
    });
  }
}
