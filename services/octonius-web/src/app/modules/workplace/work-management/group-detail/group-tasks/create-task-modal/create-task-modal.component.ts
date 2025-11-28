import { Component, OnInit, OnDestroy, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Task } from '../../../../services/group-task.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ModalService } from '../../../../../../core/services/modal.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { GroupCustomFieldDefinition } from '../../../../services/custom-field.service';

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  due_date?: Date;
  color: string;
  column_id: string;
  customFields?: Record<string, string>;
}

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss']
})
export class CreateTaskModalComponent implements OnInit, OnDestroy {
  @Input() columnId = '';
  @Input() onClose?: () => void;
  @Input() onTaskCreated?: (taskData: any) => void;
  @Input() customFieldDefinitions: GroupCustomFieldDefinition[] = [];

  // Form data
  taskData: CreateTaskData = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    color: '#3B82F6',
    column_id: '',
    customFields: {}
  };

  // Custom fields form data
  customFieldsData: Record<string, string> = {};

  // Dropdown state management
  openDropdowns: Set<string> = new Set();

  // Loading state
  isSubmitting = false;

  // Validation
  errors: { [key: string]: string } = {};

  constructor(
    private toastService: ToastService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancel();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) {
      // Allow normal enter behavior in inputs
      return;
    }
    if (!this.isSubmitting && this.taskData.title.trim()) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close all dropdowns when clicking outside
    const target = event.target as HTMLElement;
    const isDropdownClick = target.closest('.custom-dropdown');
    const isDropdownButton = target.closest('button[type="button"]');
    
    console.log('Document click - target:', target, 'isDropdownClick:', !!isDropdownClick, 'isDropdownButton:', !!isDropdownButton);
    
    if (!isDropdownClick) {
      console.log('Closing all dropdowns due to outside click');
      this.openDropdowns.clear();
    }
  }


  resetForm(): void {
    this.taskData = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      color: '#3B82F6',
      column_id: this.columnId,
      customFields: {}
    };
    this.customFieldsData = {};
    this.errors = {};
    this.isSubmitting = false;
    this.openDropdowns.clear();
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.taskData.title.trim()) {
      this.errors['title'] = 'Task title is required';
    }

    if (this.taskData.title.length > 255) {
      this.errors['title'] = 'Task title must be less than 255 characters';
    }

    if (this.taskData.due_date) {
      const dueDate = new Date(this.taskData.due_date);
      if (isNaN(dueDate.getTime())) {
        this.errors['due_date'] = 'Invalid due date';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Include custom fields in the task data
    this.taskData.customFields = { ...this.customFieldsData };

    // Call the callback function
    if (this.onTaskCreated) {
      this.onTaskCreated(this.taskData as any);
    }
    
    // Reset form after calling the callback
    setTimeout(() => {
      this.resetForm();
      this.onCancel();
    }, 100);
  }


  onCancel(): void {
    this.resetForm();
    if (this.onClose) {
      this.onClose();
    }
    this.modalService.closeModal();
  }

  resetSubmittingState(): void {
    this.isSubmitting = false;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  // Prevent modal from closing when clicking inside
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  // Helper methods for dropdown labels
  getStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'review': return 'Review';
      case 'done': return 'Done';
      default: return 'To Do';
    }
  }

  getPriorityLabel(priority: string | null | undefined): string {
    switch (priority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'urgent': return 'Urgent';
      default: return 'Medium';
    }
  }

  // Custom fields helper methods
  getCustomFieldValue(fieldId: string): string {
    return this.customFieldsData[fieldId] || '';
  }

  setCustomFieldValue(fieldId: string, value: string): void {
    console.log('Setting field value:', fieldId, 'to:', value);
    this.customFieldsData[fieldId] = value;
    console.log('Before closing dropdown, open dropdowns:', Array.from(this.openDropdowns));
    this.closeDropdown(fieldId);
    console.log('After closing dropdown, open dropdowns:', Array.from(this.openDropdowns));
    
    // Force change detection to ensure UI updates
    setTimeout(() => {
      console.log('After timeout, open dropdowns:', Array.from(this.openDropdowns));
    }, 0);
  }

  toggleDropdown(fieldId: string): void {
    console.log('Toggle dropdown for field:', fieldId, 'Current state:', this.openDropdowns.has(fieldId));
    if (this.openDropdowns.has(fieldId)) {
      this.closeDropdown(fieldId);
    } else {
      this.openDropdown(fieldId);
    }
    console.log('After toggle, open dropdowns:', Array.from(this.openDropdowns));
  }

  openDropdown(fieldId: string): void {
    this.openDropdowns.add(fieldId);
  }

  closeDropdown(fieldId: string): void {
    this.openDropdowns.delete(fieldId);
  }

  isDropdownOpen(fieldId: string): boolean {
    return this.openDropdowns.has(fieldId);
  }

  getCustomFieldError(fieldId: string): string {
    return this.errors[`customField_${fieldId}`] || '';
  }

  validateCustomField(field: GroupCustomFieldDefinition): boolean {
    const value = this.getCustomFieldValue(field.uuid);
    
    if (field.required && !value.trim()) {
      this.errors[`customField_${field.uuid}`] = `${field.name} is required`;
      return false;
    }

    if (field.type === 'number' && value && isNaN(Number(value))) {
      this.errors[`customField_${field.uuid}`] = `${field.name} must be a valid number`;
      return false;
    }

    delete this.errors[`customField_${field.uuid}`];
    return true;
  }

  hasCustomFields(): boolean {
    return this.customFieldDefinitions.length > 0;
  }

  trackByFieldId(index: number, field: GroupCustomFieldDefinition): string {
    return field.uuid;
  }

} 