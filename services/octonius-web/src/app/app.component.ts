import { HttpClient } from '@angular/common/http'
import { Component, OnInit, OnDestroy } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { environment } from '../environments/environment'

import { ModalService, ModalData } from './core/services/modal.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'octonius-web'
  currentModal: ModalData | null = null;
  isModalVisible = false;
  private modalSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private modalService: ModalService
  ) {
    console.log('Version: ', environment.version)
  }

  ngOnInit(): void {
    this.modalSubscription = this.modalService.modalData$.subscribe(modalData => {
      if (modalData) {
        this.currentModal = modalData;
        // Trigger animation after a brief delay to ensure DOM is ready
        setTimeout(() => {
          this.isModalVisible = true;
        }, 10);
      } else {
        this.isModalVisible = false;
        // Delay hiding the modal to allow exit animation
        setTimeout(() => {
          this.currentModal = null;
        }, 300);
      }
    });
  }

  ngOnDestroy(): void {
    this.modalSubscription?.unsubscribe();
  }

  closeModal(): void {
    this.isModalVisible = false;
    // Delay closing to allow exit animation
    setTimeout(() => {
      this.modalService.closeModal();
    }, 300);
  }
  
  isDatePickerModal(): boolean {
    return this.currentModal?.component?.name === 'DatePickerModalComponent';
  }
}
