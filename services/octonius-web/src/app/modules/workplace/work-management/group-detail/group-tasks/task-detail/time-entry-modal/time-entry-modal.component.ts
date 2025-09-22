import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../../../../core/components/tiptap-editor/tiptap-editor.component';

export interface TimeEntryData {
  hours: number;
  description: string;
  date: string;
}

export interface TimeInputFormat {
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-time-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorComponent],
  template: `
    <div class="w-full">
      <h3 class="font-bold text-lg mb-4">{{ isEditing ? 'Edit Time Entry' : 'Add Time Entry' }}</h3>
      
      <div class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Time Spent *</span>
          </label>
          
          <!-- Time Input Toggle -->
          <div class="flex gap-2 mb-3">
            <button 
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="timeInputMode === 'decimal'"
              [class.btn-outline]="timeInputMode !== 'decimal'"
              (click)="setTimeInputMode('decimal')">
              Decimal Hours
            </button>
            <button 
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="timeInputMode === 'hoursMinutes'"
              [class.btn-outline]="timeInputMode !== 'hoursMinutes'"
              (click)="setTimeInputMode('hoursMinutes')">
              Hours:Minutes
            </button>
          </div>

          <!-- Decimal Hours Input -->
          <div *ngIf="timeInputMode === 'decimal'" class="space-y-2">
            <input 
              type="number" 
              [(ngModel)]="formData.hours" 
              placeholder="0.5" 
              step="0.25" 
              min="0.25"
              class="input input-bordered w-full" 
              [class.input-error]="errors['hours']"
              (ngModelChange)="onDecimalHoursChange($event)"
              required />
            <div class="text-xs text-base-content/60">
              <strong>Examples:</strong> 0.5 = 30 minutes, 1.25 = 1 hour 15 minutes, 2.5 = 2 hours 30 minutes
            </div>
          </div>

          <!-- Hours:Minutes Input -->
          <div *ngIf="timeInputMode === 'hoursMinutes'" class="flex gap-2">
            <div class="flex-1">
              <label class="label py-1">
                <span class="label-text text-xs">Hours</span>
              </label>
              <input 
                type="number" 
                [(ngModel)]="timeInput.hours" 
                placeholder="0" 
                min="0"
                max="23"
                class="input input-bordered w-full" 
                (ngModelChange)="onHoursMinutesChange()" />
            </div>
            <div class="flex items-end pb-2">
              <span class="text-lg font-medium">:</span>
            </div>
            <div class="flex-1">
              <label class="label py-1">
                <span class="label-text text-xs">Minutes</span>
              </label>
              <input 
                type="number" 
                [(ngModel)]="timeInput.minutes" 
                placeholder="30" 
                min="0"
                max="59"
                step="15"
                class="input input-bordered w-full" 
                (ngModelChange)="onHoursMinutesChange()" />
            </div>
          </div>

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
          {{ isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Entry' : 'Add Entry') }}
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
export class TimeEntryModalComponent implements OnInit {
  @Input() onSave?: (data: TimeEntryData) => void;
  @Input() onCancel?: () => void;
  @Input() initialData?: TimeEntryData;

  formData: TimeEntryData = {
    hours: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  timeInput: TimeInputFormat = {
    hours: 0,
    minutes: 0
  };

  timeInputMode: 'decimal' | 'hoursMinutes' = 'hoursMinutes';
  errors: { [key: string]: string } = {};
  isSubmitting = false;
  isEditing = false;

  ngOnInit(): void {
    if (this.initialData) {
      this.formData = { ...this.initialData };
      this.isEditing = true;
      // Convert decimal hours to hours:minutes for display
      this.convertDecimalToHoursMinutes(this.formData.hours);
    }
  }

  setTimeInputMode(mode: 'decimal' | 'hoursMinutes'): void {
    this.timeInputMode = mode;
    if (mode === 'hoursMinutes') {
      this.convertDecimalToHoursMinutes(this.formData.hours);
    }
  }

  onDecimalHoursChange(decimalHours: number): void {
    this.formData.hours = decimalHours;
    if (this.timeInputMode === 'hoursMinutes') {
      this.convertDecimalToHoursMinutes(decimalHours);
    }
  }

  onHoursMinutesChange(): void {
    // Convert hours:minutes to decimal hours
    this.formData.hours = this.timeInput.hours + (this.timeInput.minutes / 60);
  }

  private convertDecimalToHoursMinutes(decimalHours: number): void {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    this.timeInput = { hours, minutes };
  }

  onSubmit(): void {
    this.errors = {};

    // Ensure we have the latest conversion if in hours:minutes mode
    if (this.timeInputMode === 'hoursMinutes') {
      this.onHoursMinutesChange();
    }

    if (this.formData.hours <= 0) {
      this.errors['hours'] = 'Time must be greater than 0';
    }

    if (this.timeInputMode === 'hoursMinutes' && this.timeInput.hours === 0 && this.timeInput.minutes === 0) {
      this.errors['hours'] = 'Please enter a valid time';
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