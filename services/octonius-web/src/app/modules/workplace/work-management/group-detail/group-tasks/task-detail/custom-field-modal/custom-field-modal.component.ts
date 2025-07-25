import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CustomFieldData {
  fieldName: string;
  fieldValue: string;
}

@Component({
  selector: 'app-custom-field-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <h3 class="font-bold text-lg mb-4">Add Custom Field</h3>
      
      <div class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Name *</span>
          </label>
          <input 
            type="text" 
            [(ngModel)]="formData.fieldName" 
            placeholder="e.g., Stage, Department, etc."
            class="input input-bordered w-full" 
            [class.input-error]="errors['fieldName']"
            required />
          <label *ngIf="errors['fieldName']" class="label">
            <span class="label-text-alt text-error">{{ errors['fieldName'] }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Value *</span>
          </label>
          <input 
            type="text" 
            [(ngModel)]="formData.fieldValue" 
            placeholder="Enter field value"
            class="input input-bordered w-full" 
            [class.input-error]="errors['fieldValue']"
            required />
          <label *ngIf="errors['fieldValue']" class="label">
            <span class="label-text-alt text-error">{{ errors['fieldValue'] }}</span>
          </label>
        </div>
      </div>

      <div class="modal-action">
        <button 
          type="button" 
          class="btn btn-ghost"
          (click)="handleCancel()"
          [disabled]="isSubmitting">
          Cancel
        </button>
        <button 
          type="button" 
          class="btn btn-primary"
          (click)="onSubmit()"
          [disabled]="!formData.fieldName.trim() || !formData.fieldValue.trim() || isSubmitting">
          <span *ngIf="isSubmitting" class="loading loading-spinner loading-xs"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Field' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CustomFieldModalComponent {
  @Input() onSave?: (data: CustomFieldData) => void;
  @Input() onCancel?: () => void;

  formData: CustomFieldData = {
    fieldName: '',
    fieldValue: ''
  };

  errors: { [key: string]: string } = {};
  isSubmitting = false;

  onSubmit(): void {
    this.errors = {};

    if (!this.formData.fieldName.trim()) {
      this.errors['fieldName'] = 'Field name is required';
    }

    if (!this.formData.fieldValue.trim()) {
      this.errors['fieldValue'] = 'Field value is required';
    }

    if (Object.keys(this.errors).length === 0) {
      this.isSubmitting = true;
      if (this.onSave) {
        this.onSave({
          fieldName: this.formData.fieldName.trim(),
          fieldValue: this.formData.fieldValue.trim()
        });
      }
    }
  }

  handleCancel(): void {
    if (this.onCancel) {
      this.onCancel();
    }
  }
} 