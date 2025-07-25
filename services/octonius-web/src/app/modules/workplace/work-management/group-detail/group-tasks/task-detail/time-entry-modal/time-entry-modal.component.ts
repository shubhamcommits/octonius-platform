import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../../../../core/components/tiptap-editor/tiptap-editor.component';

export interface TimeEntryData {
  hours: number;
  description: string;
  date: string;
}

@Component({
  selector: 'app-time-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorComponent],
  template: `
    <div class="w-full">
      <h3 class="font-bold text-lg mb-4">Add Time Entry</h3>
      
      <div class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Hours *</span>
          </label>
          <input 
            type="number" 
            [(ngModel)]="formData.hours" 
            placeholder="0.5" 
            step="0.25" 
            min="0.25"
            class="input input-bordered w-full" 
            [class.input-error]="errors['hours']"
            required />
          <label *ngIf="errors['hours']" class="label">
            <span class="label-text-alt text-error">{{ errors['hours'] }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Description</span>
          </label>
          <app-tiptap-editor
            [config]="{
              placeholder: 'What did you work on?',
              showToolbar: true,
              showBubbleMenu: true,
              showCharacterCount: true,
              maxHeight: '150px',
              minHeight: '100px',
              toolbarItems: ['bold', 'italic', 'underline', 'bulletList', 'orderedList']
            }"
            [(ngModel)]="formData.description">
          </app-tiptap-editor>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Date</span>
          </label>
          <input 
            type="date" 
            [(ngModel)]="formData.date"
            class="input input-bordered w-full" />
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
          [disabled]="formData.hours <= 0 || isSubmitting" 
          >
          <span *ngIf="isSubmitting" class="loading loading-spinner loading-xs"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Entry' }}
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
export class TimeEntryModalComponent {
  @Input() onSave?: (data: TimeEntryData) => void;
  @Input() onCancel?: () => void;

  formData: TimeEntryData = {
    hours: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  errors: { [key: string]: string } = {};
  isSubmitting = false;

  onSubmit(): void {
    this.errors = {};

    if (this.formData.hours <= 0) {
      this.errors['hours'] = 'Hours must be greater than 0';
    }

    if (Object.keys(this.errors).length === 0) {
      this.isSubmitting = true;
      if (this.onSave) {
        this.onSave({
          hours: this.formData.hours,
          description: this.formData.description.trim(),
          date: this.formData.date
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