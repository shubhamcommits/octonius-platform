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
  templateUrl: './custom-fields-settings-modal.component.html',
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
  openFieldTypeDropdowns: { [fieldId: string]: boolean } = {};
  
  fieldTypeOptions = [
    { value: 'text', label: 'Text', icon: 'Type' },
    { value: 'number', label: 'Number', icon: 'Hash' },
    { value: 'dropdown', label: 'Dropdown', icon: 'List' },
    { value: 'date', label: 'Date', icon: 'Calendar' },
    { value: 'boolean', label: 'Boolean', icon: 'ToggleLeft' }
  ];

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

  // Field Type dropdown methods
  toggleFieldTypeDropdown(fieldId: string): void {
    this.openFieldTypeDropdowns[fieldId] = !this.openFieldTypeDropdowns[fieldId];
  }

  isFieldTypeDropdownOpen(fieldId: string): boolean {
    return !!this.openFieldTypeDropdowns[fieldId];
  }

  selectFieldType(field: GroupCustomFieldDefinition, type: string): void {
    field.type = type as 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
    this.openFieldTypeDropdowns[field.uuid] = false;
    this.onFieldTypeChange(field);
  }

  getFieldTypeDisplayValue(type: string): string {
    const option = this.fieldTypeOptions.find(opt => opt.value === type);
    return option ? option.label : '';
  }

}