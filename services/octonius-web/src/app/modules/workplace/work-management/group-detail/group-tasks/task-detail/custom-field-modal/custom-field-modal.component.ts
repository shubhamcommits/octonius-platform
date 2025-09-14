import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../../shared/shared.module';
import { GroupCustomFieldDefinition, TaskCustomField } from '../../../../../services/custom-field.service';

export interface CustomFieldData {
  field_definition_id?: string;
  field_name: string;
  field_value: string;
  field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  is_group_field: boolean;
}

@Component({
  selector: 'app-custom-field-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <lucide-icon name="Plus" class="w-5 h-5 text-primary"></lucide-icon>
        </div>
        <div>
          <h3 class="font-bold text-xl text-base-content">Add Custom Field</h3>
          <p class="text-sm text-base-content/60 mt-1">
            Add a custom field to this task
          </p>
        </div>
      </div>

      <!-- Form -->
      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Field Type Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Type</span>
          </label>
          <div class="flex gap-2">
            <button 
              type="button"
              (click)="selectFieldType('group')"
              class="btn flex-1"
              [class.btn-primary]="fieldType === 'group'"
              [class.btn-outline]="fieldType !== 'group'">
              <lucide-icon name="Users" class="w-4 h-4"></lucide-icon>
              Group Field
            </button>
            <button 
              type="button"
              (click)="selectFieldType('task')"
              class="btn flex-1"
              [class.btn-primary]="fieldType === 'task'"
              [class.btn-outline]="fieldType !== 'task'">
              <lucide-icon name="FileText" class="w-4 h-4"></lucide-icon>
              Task Field
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt">
              {{ fieldType === 'group' ? 'Select from predefined group fields' : 'Create a custom field specific to this task' }}
            </span>
          </label>
        </div>

        <!-- Group Field Selection -->
        <div *ngIf="fieldType === 'group'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Select Group Field *</span>
          </label>
          <select 
            [(ngModel)]="formData.field_definition_id" 
            (change)="onGroupFieldSelected()"
            name="groupField"
            class="select select-bordered w-full"
            [class.select-error]="!formData.field_definition_id">
            <option value="">Choose a group field...</option>
            <option 
              *ngFor="let field of groupFieldDefinitions" 
              [value]="field.uuid">
              {{ field.name }} ({{ field.type }})
              <span *ngIf="isFieldAlreadyUsed(field.uuid)"> - Has value</span>
            </option>
          </select>
          <label *ngIf="!formData.field_definition_id" class="label">
            <span class="label-text-alt text-error">Please select a group field</span>
          </label>
        </div>

        <!-- Task Field Name Input -->
        <div *ngIf="fieldType === 'task'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Name *</span>
          </label>
          <input 
            type="text" 
            [(ngModel)]="formData.field_name" 
            name="fieldName"
            placeholder="e.g., Special Notes, Client Reference, etc."
            class="input input-bordered w-full"
            [class.input-error]="!formData.field_name.trim()" />
          <label *ngIf="!formData.field_name.trim()" class="label">
            <span class="label-text-alt text-error">Field name is required</span>
          </label>
        </div>

        <!-- Field Type for Task Fields -->
        <div *ngIf="fieldType === 'task'" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Type *</span>
          </label>
          <select 
            [(ngModel)]="formData.field_type" 
            name="fieldType"
            class="select select-bordered w-full">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="dropdown">Dropdown</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>

        <!-- Field Value Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Field Value *</span>
          </label>
          
          <!-- Text Input -->
          <input 
            *ngIf="selectedField?.type === 'text' || (fieldType === 'task' && formData.field_type === 'text')"
            type="text" 
            [(ngModel)]="formData.field_value" 
            name="fieldValue"
            [placeholder]="selectedField?.placeholder || 'Enter value...'"
            class="input input-bordered w-full"
            [class.input-error]="!formData.field_value.trim()" />

          <!-- Number Input -->
          <input 
            *ngIf="selectedField?.type === 'number' || (fieldType === 'task' && formData.field_type === 'number')"
            type="number" 
            [(ngModel)]="formData.field_value" 
            name="fieldValue"
            [placeholder]="selectedField?.placeholder || 'Enter number...'"
            class="input input-bordered w-full"
            [class.input-error]="!formData.field_value.trim()" />

          <!-- Date Input -->
          <input 
            *ngIf="selectedField?.type === 'date' || (fieldType === 'task' && formData.field_type === 'date')"
            type="date" 
            [(ngModel)]="formData.field_value" 
            name="fieldValue"
            class="input input-bordered w-full"
            [class.input-error]="!formData.field_value.trim()" />

          <!-- Boolean Input -->
          <select 
            *ngIf="selectedField?.type === 'boolean' || (fieldType === 'task' && formData.field_type === 'boolean')"
            [(ngModel)]="formData.field_value" 
            name="fieldValue"
            class="select select-bordered w-full"
            [class.select-error]="!formData.field_value">
            <option value="">Select value...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <!-- Dropdown Input -->
          <select 
            *ngIf="selectedField?.type === 'dropdown' || (fieldType === 'task' && formData.field_type === 'dropdown')"
            [(ngModel)]="formData.field_value" 
            name="fieldValue"
            class="select select-bordered w-full"
            [class.select-error]="!formData.field_value">
            <option value="">Select option...</option>
            <option 
              *ngFor="let option of getDropdownOptions()" 
              [value]="option">
              {{ option }}
            </option>
          </select>

          <label *ngIf="!formData.field_value.trim()" class="label">
            <span class="label-text-alt text-error">Field value is required</span>
          </label>
        </div>

        <!-- Field Description (for group fields) -->
        <div *ngIf="fieldType === 'group' && selectedField?.description" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Description</span>
          </label>
          <p class="text-sm text-base-content/60">{{ selectedField?.description }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-base-200">
          <button 
            type="button" 
            (click)="onCancel?.()"
            class="btn btn-ghost">
            Cancel
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            [disabled]="!isFormValid()">
            {{ isFieldAlreadyUsed(formData.field_definition_id || '') ? 'Update Field' : 'Add Field' }}
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
export class CustomFieldModalComponent implements OnInit {
  @Input() groupFieldDefinitions: GroupCustomFieldDefinition[] = [];
  @Input() taskCustomFields: TaskCustomField[] = [];
  @Input() onSave?: (data: CustomFieldData) => void;
  @Input() onCancel?: () => void;

  fieldType: 'group' | 'task' = 'group';
  selectedField: GroupCustomFieldDefinition | null = null;
  
  formData: CustomFieldData = {
    field_name: '',
    field_value: '',
    field_type: 'text',
    is_group_field: false
  };

  constructor() {}

  ngOnInit(): void {
    // Initialize form based on available fields
    if (this.groupFieldDefinitions.length === 0) {
      this.fieldType = 'task';
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancel?.();
  }

  selectFieldType(type: 'group' | 'task'): void {
    this.fieldType = type;
    this.formData = {
      field_name: '',
      field_value: '',
      field_type: 'text',
      is_group_field: type === 'group'
    };
    this.selectedField = null;
  }

  onGroupFieldSelected(): void {
    if (!this.formData.field_definition_id) {
      this.selectedField = null;
      return;
    }

    this.selectedField = this.groupFieldDefinitions.find(
      field => field.uuid === this.formData.field_definition_id
    ) || null;

    if (this.selectedField) {
      this.formData.field_type = this.selectedField.type;
      this.formData.field_name = this.selectedField.name;
      
      // Check if this field already has a value and pre-populate it
      const existingTaskField = this.taskCustomFields.find(
        tf => tf.field_definition_id === this.formData.field_definition_id
      );
      if (existingTaskField) {
        this.formData.field_value = existingTaskField.field_value;
      } else {
        this.formData.field_value = '';
      }
    }
  }

  isFieldAlreadyUsed(fieldDefinitionId: string): boolean {
    return this.taskCustomFields.some(
      field => field.field_definition_id === fieldDefinitionId
    );
  }

  getDropdownOptions(): string[] {
    if (this.fieldType === 'group' && this.selectedField?.options) {
      return this.selectedField.options;
    }
    // For task fields, you might want to add custom options handling
    return [];
  }

  isFormValid(): boolean {
    if (!this.formData.field_value.trim()) return false;
    
    if (this.fieldType === 'group') {
      return !!this.formData.field_definition_id;
    } else {
      return !!this.formData.field_name.trim();
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.onSave?.(this.formData);
  }
}