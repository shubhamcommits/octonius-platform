import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../../../../../core/services/modal.service';
import { SharedModule } from '../../../../../../shared/shared.module';

export interface DatePickerData {
  currentDate?: string | null;
  onSave?: (date: Date | null) => void;
  onCancel?: () => void;
}

@Component({
  selector: 'app-date-picker-modal',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="calendar-container">
      <!-- Month Navigation -->
      <div class="month-navigation">
        <button class="nav-btn" (click)="previousMonth()" type="button">
          <lucide-icon name="ChevronLeft" size="20" />
        </button>
        <h4 class="month-year">{{ currentMonthName }} {{ currentYear }}</h4>
        <button class="nav-btn" (click)="nextMonth()" type="button">
          <lucide-icon name="ChevronRight" size="20" />
        </button>
      </div>

      <!-- Day Headers -->
      <div class="day-headers">
        <div class="day-header" *ngFor="let day of dayNames">{{ day }}</div>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div 
          *ngFor="let day of calendarDays" 
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.selected]="day.isSelected"
          [class.today]="day.isToday"
          [class.disabled]="day.isDisabled"
          (click)="selectDate(day)"
        >
          {{ day.dayNumber }}
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="btn btn-secondary" (click)="clearDate()" type="button">
          Clear Date
        </button>
        <div class="action-buttons">
          <button class="btn btn-secondary" (click)="closeModal()" type="button">
            Cancel
          </button>
          <button class="btn btn-primary" (click)="confirmSelection()" type="button">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./date-picker-modal.component.scss']
})
export class DatePickerModalComponent implements OnInit {
  @Input() currentDate?: string | null;
  @Input() onSave?: (date: Date | null) => void;
  @Input() onCancel?: () => void;

  currentYear: number;
  currentMonth: number;
  selectedDate: Date | null = null;
  today: Date = new Date();

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];

  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private cdr: ChangeDetectorRef, 
    private modalService: ModalService
  ) {
    this.currentYear = this.today.getFullYear();
    this.currentMonth = this.today.getMonth();
  }

  ngOnInit(): void {
    console.log('Calendar initialized');
    console.log('Current date input:', this.currentDate);
    this.initializeDate();
    this.generateCalendar();
  }

  private initializeDate(): void {
    if (this.currentDate) {
      const date = new Date(this.currentDate);
      console.log('Parsing current date:', this.currentDate, 'Result:', date);
      if (!isNaN(date.getTime())) {
        this.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
        console.log('Set selected date to:', this.selectedDate);
      }
    }
  }

  get currentMonthName(): string {
    return this.monthNames[this.currentMonth];
  }

  private generateCalendar(): void {
    this.calendarDays = [];
    
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
      const isToday = this.isSameDay(currentDate, this.today);
      const isSelected = this.selectedDate ? this.isSameDay(currentDate, this.selectedDate) : false;

      this.calendarDays.push({
        date: currentDate,
        dayNumber: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled: false
      });
    }
    
    console.log('Generated calendar with', this.calendarDays.length, 'days');
    console.log('Today:', this.today.toDateString());
    console.log('Selected:', this.selectedDate?.toDateString());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    
    console.log('Selecting date:', day.date.toDateString());
    this.selectedDate = new Date(day.date);
    this.generateCalendar();
    this.cdr.detectChanges();
    console.log('Selected date set to:', this.selectedDate?.toDateString());
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  clearDate(): void {
    console.log('Clearing selected date');
    this.selectedDate = null;
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  confirmSelection(): void {
    console.log('Confirming selection:', this.selectedDate?.toDateString());
    if (this.onSave) {
      this.onSave(this.selectedDate);
    }
  }

  closeModal(): void {
    if (this.onCancel) {
      this.onCancel();
    } else {
      this.modalService.closeModal();
    }
  }
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
} 