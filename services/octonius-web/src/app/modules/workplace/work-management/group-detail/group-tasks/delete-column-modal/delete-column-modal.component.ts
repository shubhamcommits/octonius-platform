import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';

export interface DeleteColumnData {
  columnId: string;
}

@Component({
  selector: 'app-delete-column-modal',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './delete-column-modal.component.html',
  styleUrls: ['./delete-column-modal.component.scss']
})
export class DeleteColumnModalComponent {
  @Input() open = false;
  @Input() columnName = '';
  @Input() columnId = '';
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<DeleteColumnData>();

  isDeleting = false;

  onConfirm() {
    this.isDeleting = true;
    this.delete.emit({
      columnId: this.columnId
    });
  }

  onClose() {
    this.close.emit();
  }
}
