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
  templateUrl: './custom-field-modal.component.html',
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
  isGroupFieldDropdownOpen = false;
  isFieldTypeDropdownOpen = false;
  isBooleanDropdownOpen = false;
  isDropdownValueDropdownOpen = false;
  
  fieldTypeOptions = [
    { value: 'text', label: 'Text', icon: 'Type' },
    { value: 'number', label: 'Number', icon: 'Hash' },
    { value: 'dropdown', label: 'Dropdown', icon: 'List' },
    { value: 'date', label: 'Date', icon: 'Calendar' },
    { value: 'boolean', label: 'Boolean', icon: 'ToggleLeft' }
  ];
  
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


  getDropdownOptions(): string[] {
    if (this.fieldType === 'group' && this.selectedField?.options) {
      return this.selectedField.options;
    }
    // For task fields, you might want to add custom options handling
    return [];
  }

  // Dropdown methods
  toggleGroupFieldDropdown(): void {
    this.isGroupFieldDropdownOpen = !this.isGroupFieldDropdownOpen;
  }

  selectGroupField(fieldId: string): void {
    this.formData.field_definition_id = fieldId;
    this.isGroupFieldDropdownOpen = false;
    this.onGroupFieldSelected();
  }

  getGroupFieldDisplayValue(): string {
    if (!this.formData.field_definition_id) return '';
    const field = this.groupFieldDefinitions.find(f => f.uuid === this.formData.field_definition_id);
    return field ? `${field.name} (${field.type})` : '';
  }

  getGroupFieldError(): boolean {
    return !this.formData.field_definition_id;
  }

  // Field Type dropdown methods
  toggleFieldTypeDropdown(): void {
    this.isFieldTypeDropdownOpen = !this.isFieldTypeDropdownOpen;
  }

  selectFieldTypeValue(type: string): void {
    this.formData.field_type = type as 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
    this.isFieldTypeDropdownOpen = false;
  }

  getFieldTypeDisplayValue(): string {
    const option = this.fieldTypeOptions.find(opt => opt.value === this.formData.field_type);
    return option ? option.label : '';
  }

  // Boolean dropdown methods
  toggleBooleanDropdown(): void {
    this.isBooleanDropdownOpen = !this.isBooleanDropdownOpen;
  }

  selectBooleanValue(value: string): void {
    this.formData.field_value = value;
    this.isBooleanDropdownOpen = false;
  }

  getBooleanDisplayValue(): string {
    if (this.formData.field_value === 'true') return 'Yes';
    if (this.formData.field_value === 'false') return 'No';
    return '';
  }

  // Dropdown value methods
  toggleDropdownValueDropdown(): void {
    this.isDropdownValueDropdownOpen = !this.isDropdownValueDropdownOpen;
  }

  selectDropdownValue(value: string): void {
    this.formData.field_value = value;
    this.isDropdownValueDropdownOpen = false;
  }
}