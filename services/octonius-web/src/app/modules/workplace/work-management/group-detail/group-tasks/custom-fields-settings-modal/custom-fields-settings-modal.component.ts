import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { CustomFieldService, GroupCustomFieldDefinition, CreateGroupFieldDefinitionData } from '../../../../services/custom-field.service';

export interface CustomFieldsSettingsData {
  customFields: GroupCustomFieldDefinition[];
}

@Component({
  selector: 'app-custom-fields-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="w-full max-w-5xl max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6 flex-shrink-0">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <lucide-icon name="Settings" class="w-5 h-5 text-primary"></lucide-icon>
        </div>
        <div>
          <h3 class="font-bold text-xl text-base-content">Custom Fields Settings</h3>
          <p class="text-sm text-base-content/60 mt-1">
            Configure fields that appear in every new task to standardize data collection
          </p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-12">
        <div class="loading loading-spinner loading-lg"></div>
        <span class="ml-3 text-base-content/60">Loading custom fields...</span>
      </div>

      <!-- Custom Fields List -->
      <div *ngIf="!isLoading" class="space-y-4 mb-6 flex-1 overflow-y-auto pr-2">
        <div *ngFor="let field of customFields; trackBy: trackByFieldId; let i = index" 
             class="group bg-base-100 rounded-xl border border-base-200 hover:border-primary/20 transition-all duration-200 hover:shadow-sm">
          <div class="p-6">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 space-y-4">
                <!-- Field Header -->
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <lucide-icon [name]="getFieldIcon(field.type)" class="w-4 h-4 text-primary"></lucide-icon>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-base-content">{{ field.name }}</h4>
                      <span class="badge badge-outline badge-sm">{{ field.type }}</span>
                      <span *ngIf="field.required" class="badge badge-error badge-sm">Required</span>
                    </div>
                    <p *ngIf="field.description" class="text-sm text-base-content/60 mt-1">{{ field.description }}</p>
                  </div>
                </div>

                <!-- Field Configuration -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Field Type -->
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Field Type</span>
                    </label>
                    <select 
                      [(ngModel)]="field.type" 
                      (change)="onFieldTypeChange(field)"
                      class="select select-bordered w-full" 
                      [class.select-error]="getFieldError(field.uuid, 'type')">
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    <label *ngIf="getFieldError(field.uuid, 'type')" class="label">
                      <span class="label-text-alt text-error">{{ getFieldError(field.uuid, 'type') }}</span>
                    </label>
                  </div>

                  <!-- Required -->
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Required Field</span>
                    </label>
                    <label class="cursor-pointer label">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="field.required" 
                        class="checkbox checkbox-primary" />
                      <span class="label-text">This field is required</span>
                    </label>
                  </div>
                </div>

                <!-- Field Name -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Field Name *</span>
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="field.name" 
                    placeholder="e.g., Department, Priority, etc."
                    class="input input-bordered w-full" 
                    [class.input-error]="getFieldError(field.uuid, 'name')" />
                  <label *ngIf="getFieldError(field.uuid, 'name')" class="label">
                    <span class="label-text-alt text-error">{{ getFieldError(field.uuid, 'name') }}</span>
                  </label>
                </div>

                <!-- Field Description -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Description</span>
                  </label>
                  <textarea 
                    [(ngModel)]="field.description" 
                    placeholder="Optional description for this field"
                    class="textarea textarea-bordered w-full" 
                    rows="2"></textarea>
                </div>

                <!-- Field Placeholder -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Placeholder Text</span>
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="field.placeholder" 
                    placeholder="e.g., Enter department name"
                    class="input input-bordered w-full" />
                </div>

                <!-- Dropdown Options -->
                <div *ngIf="field.type === 'dropdown'" class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Dropdown Options *</span>
                  </label>
                  <div class="space-y-2">
                    <div *ngFor="let option of getFieldOptions(field.uuid); let optionIndex = index" 
                         class="flex items-center gap-2">
                      <input 
                        type="text" 
                        [(ngModel)]="field.options![optionIndex]" 
                        placeholder="Option {{ optionIndex + 1 }}"
                        class="input input-bordered flex-1" 
                        [class.input-error]="getFieldError(field.uuid, 'options')" />
                      <button 
                        type="button" 
                        (click)="removeFieldOption(field.uuid, optionIndex)"
                        class="btn btn-ghost btn-sm text-error hover:bg-error/10"
                        [disabled]="field.options!.length <= 1">
                        <lucide-icon name="X" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                    <button 
                      type="button" 
                      (click)="addFieldOption(field.uuid)"
                      class="btn btn-outline btn-sm w-full">
                      <lucide-icon name="Plus" class="w-4 h-4"></lucide-icon>
                      Add Option
                    </button>
                  </div>
                  <label *ngIf="getFieldError(field.uuid, 'options')" class="label">
                    <span class="label-text-alt text-error">{{ getFieldError(field.uuid, 'options') }}</span>
                  </label>
                </div>
              </div>

              <!-- Field Actions -->
              <div class="flex flex-col gap-2">
                <button 
                  type="button" 
                  (click)="moveFieldUp(i)"
                  [disabled]="i === 0"
                  class="btn btn-ghost btn-sm"
                  title="Move up">
                  <lucide-icon name="ChevronUp" class="w-4 h-4"></lucide-icon>
                </button>
                <button 
                  type="button" 
                  (click)="moveFieldDown(i)"
                  [disabled]="i === customFields.length - 1"
                  class="btn btn-ghost btn-sm"
                  title="Move down">
                  <lucide-icon name="ChevronDown" class="w-4 h-4"></lucide-icon>
                </button>
                <button 
                  type="button" 
                  (click)="removeField(field.uuid)"
                  class="btn btn-ghost btn-sm text-error hover:bg-error/10"
                  title="Remove field">
                  <lucide-icon name="Trash2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="customFields.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <lucide-icon name="Settings" class="w-8 h-8 text-base-content/40"></lucide-icon>
          </div>
          <h3 class="font-semibold text-base-content mb-2">No custom fields yet</h3>
          <p class="text-sm text-base-content/60 mb-4">Add fields to standardize data collection across tasks</p>
          <button 
            type="button" 
            (click)="addField()"
            class="btn btn-primary">
            <lucide-icon name="Plus" class="w-4 h-4"></lucide-icon>
            Add First Field
          </button>
        </div>
      </div>

      <!-- Add Field Button -->
      <div *ngIf="!isLoading && customFields.length > 0" class="flex-shrink-0">
        <button 
          type="button" 
          (click)="addField()"
          class="btn btn-outline btn-primary flex items-center gap-2 w-full">
          <lucide-icon name="Plus" class="w-4 h-4"></lucide-icon>
          Add Custom Field
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-6 border-t border-base-200 flex-shrink-0">
        <button 
          type="button" 
            (click)="onCancel?.()"
          class="btn btn-ghost"
          [disabled]="isSubmitting">
          Cancel
        </button>
        <button 
          type="button" 
          (click)="onSubmit()"
          class="btn btn-primary"
          [disabled]="!isFormValid() || isSubmitting">
          <span *ngIf="isSubmitting" class="loading loading-spinner loading-sm"></span>
          {{ isSubmitting ? 'Saving...' : 'Save Settings' }}
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
export class CustomFieldsSettingsModalComponent implements OnInit {
  @Input() groupId: string = '';
  @Input() onSave?: (data: CustomFieldsSettingsData) => void;
  @Input() onCancel?: () => void;

  customFields: GroupCustomFieldDefinition[] = [];
  fieldErrors: { [fieldId: string]: { [key: string]: string } } = {};
  isSubmitting = false;
  isLoading = false;

  constructor(
    private customFieldService: CustomFieldService
  ) {}

  ngOnInit(): void {
    this.loadCustomFields();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancel?.();
  }

  loadCustomFields(): void {
    if (!this.groupId) return;
    
    this.isLoading = true;
    this.customFieldService.getGroupFieldDefinitions(this.groupId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.customFields = response.data;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading custom fields:', error);
        this.isLoading = false;
      }
    });
  }

  addField(): void {
    const newField: GroupCustomFieldDefinition = {
      uuid: `temp_${Date.now()}`,
      group_id: this.groupId,
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
      options: [],
      validation_rules: {},
      display_order: this.customFields.length,
      is_active: true,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.customFields.push(newField);
  }

  removeField(fieldId: string): void {
    const field = this.customFields.find(f => f.uuid === fieldId);
    if (!field) return;

    // If it's a saved field, delete from API
    if (!field.uuid.startsWith('temp_')) {
      this.customFieldService.deleteGroupFieldDefinition(fieldId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.customFields = this.customFields.filter(f => f.uuid !== fieldId);
          }
        },
        error: (error: any) => {
          console.error('Error deleting field:', error);
        }
      });
    } else {
      // If it's a new field, just remove from array
      this.customFields = this.customFields.filter(f => f.uuid !== fieldId);
    }
  }

  moveFieldUp(index: number): void {
    if (index > 0) {
      const field = this.customFields[index];
      this.customFields.splice(index, 1);
      this.customFields.splice(index - 1, 0, field);
      this.updateDisplayOrders();
    }
  }

  moveFieldDown(index: number): void {
    if (index < this.customFields.length - 1) {
      const field = this.customFields[index];
      this.customFields.splice(index, 1);
      this.customFields.splice(index + 1, 0, field);
      this.updateDisplayOrders();
    }
  }

  updateDisplayOrders(): void {
    this.customFields.forEach((field, index) => {
      field.display_order = index;
    });
  }

  onFieldTypeChange(field: GroupCustomFieldDefinition): void {
    // Reset options when changing from dropdown
    if (field.type !== 'dropdown') {
      field.options = [];
    } else if (!field.options) {
      field.options = [''];
    }
  }

  getFieldOptions(fieldId: string): string[] {
    const field = this.customFields.find(f => f.uuid === fieldId);
    return field?.options || [];
  }

  addFieldOption(fieldId: string): void {
    const field = this.customFields.find(f => f.uuid === fieldId);
    if (field && field.type === 'dropdown') {
      if (!field.options) field.options = [];
      field.options.push('');
    }
  }

  removeFieldOption(fieldId: string, optionIndex: number): void {
    const field = this.customFields.find(f => f.uuid === fieldId);
    if (field && field.options && field.options.length > 1) {
      field.options.splice(optionIndex, 1);
    }
  }

  getFieldIcon(type: string): string {
    const icons: { [key: string]: string } = {
      text: 'FileText',
      number: 'Hash',
      dropdown: 'ChevronDown',
      date: 'Calendar',
      boolean: 'CheckCircle'
    };
    return icons[type] || 'FileText';
  }

  getFieldError(fieldId: string, field: string): string {
    return this.fieldErrors[fieldId]?.[field] || '';
  }

  setFieldError(fieldId: string, field: string, error: string): void {
    if (!this.fieldErrors[fieldId]) {
      this.fieldErrors[fieldId] = {};
    }
    this.fieldErrors[fieldId][field] = error;
  }

  clearFieldErrors(fieldId: string): void {
    delete this.fieldErrors[fieldId];
  }

  validateField(field: GroupCustomFieldDefinition): boolean {
    this.clearFieldErrors(field.uuid);
    let isValid = true;

    if (!field.name?.trim()) {
      this.setFieldError(field.uuid, 'name', 'Field name is required');
      isValid = false;
    }

    if (field.type === 'dropdown' && (!field.options || field.options.length === 0)) {
      this.setFieldError(field.uuid, 'options', 'At least one option is required for dropdown fields');
      isValid = false;
    }

    if (field.type === 'dropdown' && field.options) {
      const emptyOptions = field.options.filter((option: string) => !option.trim());
      if (emptyOptions.length > 0) {
        this.setFieldError(field.uuid, 'options', 'All dropdown options must have values');
        isValid = false;
      }
    }

    return isValid;
  }

  isFormValid(): boolean {
    if (this.customFields.length === 0) return true;
    
    let isValid = true;
    this.customFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isSubmitting = true;
    const promises: Promise<any>[] = [];

    this.customFields.forEach(field => {
      if (field.uuid.startsWith('temp_')) {
        // Create new field
        const fieldData: CreateGroupFieldDefinitionData = {
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          description: field.description,
          options: field.type === 'dropdown' ? field.options : undefined,
          display_order: field.display_order
        };

        promises.push(
          this.customFieldService.createGroupFieldDefinition(this.groupId, fieldData).toPromise()
        );
      } else {
        // Update existing field
        const fieldData: Partial<CreateGroupFieldDefinitionData> = {
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          description: field.description,
          options: field.type === 'dropdown' ? field.options : undefined,
          display_order: field.display_order
        };

        promises.push(
          this.customFieldService.updateGroupFieldDefinition(field.uuid, fieldData).toPromise()
        );
      }
    });

    Promise.all(promises).then(() => {
      this.isSubmitting = false;
      this.onSave?.({ customFields: this.customFields });
    }).catch((error) => {
      console.error('Error saving custom fields:', error);
      this.isSubmitting = false;
    });
  }

  trackByFieldId(index: number, field: GroupCustomFieldDefinition): string {
    return field.uuid;
  }
}