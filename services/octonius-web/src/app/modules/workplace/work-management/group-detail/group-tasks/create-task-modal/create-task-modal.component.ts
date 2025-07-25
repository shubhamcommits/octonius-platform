import { Component, OnInit, OnDestroy, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Task } from '../../../../services/group-task.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ModalService } from '../../../../../../core/services/modal.service';
import { SharedModule } from '../../../../../shared/shared.module'

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  due_date?: Date;
  color: string;
  column_id: string;
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

  // Form data
  taskData: CreateTaskData = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    color: '#3B82F6',
    column_id: ''
  };

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

  resetForm(): void {
    this.taskData = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      color: '#3B82F6',
      column_id: this.columnId
    };
    this.errors = {};
    this.isSubmitting = false;
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

    // Call the callback function
    if (this.onTaskCreated) {
      this.onTaskCreated(this.taskData as any);
    }
    
    // Reset form after successful submission
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
} 