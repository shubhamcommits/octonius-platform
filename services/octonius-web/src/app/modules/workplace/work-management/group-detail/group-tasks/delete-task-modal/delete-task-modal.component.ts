import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';

export interface DeleteTaskData {
  taskId: string;
}

@Component({
  selector: 'app-delete-task-modal',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="w-full">
      <h2 class="text-xl font-bold text-error mb-4">Delete Task</h2>
      
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
            <lucide-icon name="AlertTriangle" class="w-5 h-5 text-error"></lucide-icon>
          </div>
          <div>
            <p class="text-base-content/80 mb-2">
              Are you sure you want to delete the task <strong>"{{ taskTitle }}"</strong>?
            </p>
            <p class="text-error text-sm font-medium">
              This action cannot be undone and the task will be permanently deleted.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-base-300">
          <button 
            type="button" 
            class="btn btn-ghost" 
            (click)="handleCancel()"
            [disabled]="isDeleting">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn-error" 
            (click)="onConfirm()"
            [disabled]="isDeleting">
            <span *ngIf="isDeleting" class="loading loading-spinner loading-sm"></span>
            {{ isDeleting ? 'Deleting...' : 'Delete Task' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DeleteTaskModalComponent implements OnInit {
  @Input() onDelete?: (data: DeleteTaskData) => void;
  @Input() onCancel?: () => void;
  @Input() taskTitle = '';
  @Input() taskId = '';

  isDeleting = false;

  ngOnInit(): void {
    // Component initialization
  }

  onConfirm() {
    this.isDeleting = true;
    if (this.onDelete) {
      this.onDelete({
        taskId: this.taskId
      });
    }
  }

  handleCancel() {
    if (this.onCancel) {
      this.onCancel();
    }
  }
}
