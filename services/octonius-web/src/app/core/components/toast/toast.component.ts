import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { trigger, transition, style, animate, AnimationEvent, state } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-xs pointer-events-none">
      <div *ngFor="let toast of toasts; trackBy: trackById"
        [@slideIn]
        class="pointer-events-auto"
      >
        <div class="group relative flex items-center min-w-[280px] max-w-xs px-5 py-4 rounded-xl shadow-lg bg-base-100 dark:bg-base-200 border-l-4 overflow-hidden"
          [ngClass]="{
            'border-green-500': toast.type === 'success',
            'border-red-500': toast.type === 'error',
            'border-blue-500': toast.type === 'info',
            'border-yellow-500': toast.type === 'warning',
          }"
        >
          <span class="flex items-center justify-center w-6 h-6 rounded-full mr-3"
            [ngClass]="{
              'bg-green-100 text-green-600': toast.type === 'success',
              'bg-red-100 text-red-600': toast.type === 'error',
              'bg-blue-100 text-blue-600': toast.type === 'info',
              'bg-yellow-100 text-yellow-600': toast.type === 'warning',
            }"
          >
            {{ getIcon(toast.type) }}
          </span>
          <span class="flex-1 text-base text-base-content font-medium">{{ toast.message }}</span>
          <button
            class="ml-4 text-base-content/60 hover:text-base-content transition-colors rounded-full p-1 focus:outline-none"
            (click)="startRemoveToast(toast.id)"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host { display: block; }
    @media (max-width: 640px) {
      .fixed.top-6.right-6 { right: 0.5rem; left: 0.5rem; top: 0.5rem; }
    }
    `
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          transform: 'translateX(120%)',
          opacity: 0
        }),
        animate('300ms ease-out', 
          style({ 
            transform: 'translateX(0)',
            opacity: 1
          })
        )
      ]),
      transition(':leave', [
        animate('300ms ease-in', 
          style({ 
            transform: 'translateX(120%)',
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription: Subscription;
  private timers = new Map<number, any>();
  private defaultDuration = 5000; // 5 seconds

  constructor(private toastService: ToastService) {
    this.subscription = this.toastService.getToasts().subscribe(toasts => {
      // Handle new toasts
      toasts.forEach(toast => {
        if (!this.timers.has(toast.id)) {
          this.startTimer(toast.id);
        }
      });
      
      // Clean up timers for removed toasts
      this.timers.forEach((_, id) => {
        if (!toasts.find(t => t.id === id)) {
          this.clearTimer(id);
        }
      });
      
      this.toasts = toasts;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    // Clear all timers
    this.timers.forEach((_, id) => this.clearTimer(id));
  }

  trackById(index: number, toast: Toast): number {
    return toast.id;
  }

  startRemoveToast(id: number): void {
    this.clearTimer(id);
    this.toastService.remove(id);
  }

  onAnimationDone(event: AnimationEvent, toast: Toast): void {
    // No need to handle animation done for :leave as Angular handles it
  }

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '⨉';
      case 'info':
        return 'i';
      case 'warning':
        return '!';
      default:
        return '';
    }
  }

  private startTimer(id: number): void {
    const timeout = setTimeout(() => {
      this.startRemoveToast(id);
    }, this.defaultDuration);
    
    this.timers.set(id, timeout);
  }
  
  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
