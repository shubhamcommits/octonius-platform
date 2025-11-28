import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CreateSectionData {
  name: string;
  color: string;
}

@Component({
  selector: 'app-create-section-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <h3 class="font-bold text-lg mb-4">Create New Section</h3>
      
      <form (submit)="onSubmit(); $event.preventDefault()">
        <div class="space-y-4">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Section Name</span>
            </label>
            <input 
              type="text" 
              [(ngModel)]="formData.name" 
              name="sectionName"
              placeholder="e.g., To Do, In Progress, Done" 
              class="input input-bordered w-full" 
              [class.input-error]="errors['name']"
              required />
            <label *ngIf="errors['name']" class="label">
              <span class="label-text-alt text-error">{{ errors['name'] }}</span>
            </label>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Color</span>
            </label>
            <input 
              type="color" 
              [(ngModel)]="formData.color" 
              name="sectionColor"
              class="input input-bordered w-full h-12" />
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
            type="submit" 
            class="btn btn-primary"
            [disabled]="!formData.name.trim() || isSubmitting">
            <span *ngIf="isSubmitting" class="loading loading-spinner loading-xs"></span>
            {{ isSubmitting ? 'Creating...' : 'Create Section' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CreateSectionModalComponent implements OnInit {
  @Input() onSave?: (data: CreateSectionData) => void;
  @Input() onCancel?: () => void;
  @Input() initialData?: CreateSectionData;

  formData: CreateSectionData = {
    name: '',
    color: '#3b82f6' // Default blue color
  };

  errors: { [key: string]: string } = {};
  isSubmitting = false;

  ngOnInit(): void {
    if (this.initialData) {
      this.formData = { ...this.initialData };
    }
  }

  onSubmit(): void {
    this.errors = {};

    if (!this.formData.name.trim()) {
      this.errors['name'] = 'Section name is required';
    }

    if (Object.keys(this.errors).length === 0) {
      this.isSubmitting = true;
      if (this.onSave) {
        this.onSave({
          name: this.formData.name.trim(),
          color: this.formData.color
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
