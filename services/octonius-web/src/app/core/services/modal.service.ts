import { Injectable, EventEmitter } from '@angular/core';

export interface ModalData {
  component: any;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public modalData$ = new EventEmitter<ModalData | null>();

  openModal(component: any, data?: any): void {
    this.modalData$.emit({ component, data });
  }

  closeModal(): void {
    this.modalData$.emit(null);
  }
} 