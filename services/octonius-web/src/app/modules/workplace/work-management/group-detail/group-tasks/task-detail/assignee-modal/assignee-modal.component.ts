import { Component, OnInit, OnDestroy, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GroupMember } from '../../../../../services/group-task.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { ModalService } from '../../../../../../../core/services/modal.service';

export interface AssigneeData {
  selectedUserIds: string[];
  groupMembers: GroupMember[];
}

@Component({
  selector: 'app-assignee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignee-modal.component.html',
  styleUrls: ['./assignee-modal.component.scss']
})
export class AssigneeModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() assigneeData?: AssigneeData;
  @Input() onSave?: (selectedUserIds: string[]) => void;
  @Input() onCancel?: () => void;

  // Form data
  assigneeForm = {
    selectedUserIds: [] as string[]
  };

  // Data
  groupMembers: GroupMember[] = [];

  // Loading state
  isSaving = false;

  constructor(
    private toastService: ToastService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assigneeData'] && changes['assigneeData'].currentValue) {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancelAction();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) {
      // Allow normal enter behavior in inputs
      return;
    }
    if (!this.isSaving) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  resetForm(): void {
    if (this.assigneeData) {
      this.assigneeForm.selectedUserIds = [...this.assigneeData.selectedUserIds];
      this.groupMembers = [...this.assigneeData.groupMembers];
    } else {
      this.assigneeForm.selectedUserIds = [];
      this.groupMembers = [];
    }
    this.isSaving = false;
  }

  toggleAssignee(userId: string, event: any): void {
    event.stopPropagation();
    const index = this.assigneeForm.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.assigneeForm.selectedUserIds.splice(index, 1);
    } else {
      this.assigneeForm.selectedUserIds.push(userId);
    }
  }

  isAssigneeSelected(userId: string): boolean {
    return this.assigneeForm.selectedUserIds.includes(userId);
  }

  onSubmit(): void {
    this.isSaving = true;

    // Call the callback function
    if (this.onSave) {
      this.onSave(this.assigneeForm.selectedUserIds);
    }
    
    this.isSaving = false;
  }

  onCancelAction(): void {
    if (this.onCancel) {
      this.onCancel();
    }
    this.modalService.closeModal();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancelAction();
    }
  }

  // Prevent modal from closing when clicking inside
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  getUserAvatarUrl(user: any): string {
    return user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getUserDisplayName(user))}&background=random`;
  }

  getUserDisplayName(user: any): string {
    return user.display_name || user.full_name || user.email || 'Unknown User';
  }

  getUserInitials(user: any): string {
    const name = this.getUserDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
} 