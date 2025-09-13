import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';

export interface RenameColumnData {
  columnId: string;
  newName: string;
}

@Component({
  selector: 'app-rename-column-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './rename-column-modal.component.html',
  styleUrls: ['./rename-column-modal.component.scss']
})
export class RenameColumnModalComponent implements OnInit, OnChanges {
  @Input() currentName = '';
  @Input() columnId = '';
  @Input() onCloseCallback?: () => void;
  @Input() onRenameCallback?: (data: RenameColumnData) => void;
  @Output() close = new EventEmitter<void>();
  @Output() rename = new EventEmitter<RenameColumnData>();

  columnName = '';
  isSubmitting = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.columnName = this.currentName;
  }

  onSubmit() {
    if (!this.columnName.trim()) {
      this.hasError = true;
      this.errorMessage = 'Section name is required';
      return;
    }

    if (this.columnName.trim() === this.currentName) {
      this.onClose();
      return;
    }

    this.isSubmitting = true;
    this.hasError = false;

    const data = {
      columnId: this.columnId,
      newName: this.columnName.trim()
    };

    // Use callback if provided, otherwise emit event
    if (this.onRenameCallback) {
      this.onRenameCallback(data);
    } else {
      this.rename.emit(data);
    }
  }

  onClose() {
    // Use callback if provided, otherwise emit event
    if (this.onCloseCallback) {
      this.onCloseCallback();
    } else {
      this.close.emit();
    }
  }

  // Reset form when modal opens
  ngOnChanges() {
    this.columnName = this.currentName;
    this.hasError = false;
    this.errorMessage = '';
    this.isSubmitting = false;
  }
}
