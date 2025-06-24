import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { trigger, transition, style, animate, AnimationEvent } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-xs">
      <div *ngFor="let toast of toasts; let i = index"
        [@toastAnim]="leavingToasts.has(toast.id) ? 'leave' : 'enter'"
        (@toastAnim.done)="onAnimationDone($event, toast.id)"
        [style.animation-delay.ms]="i * 50"
        class="group relative flex items-center min-w-[280px] max-w-xs px-5 py-4 rounded-xl shadow-lg bg-white/90 dark:bg-base-200/90 border-l-4 overflow-hidden"
        [ngClass]="{
          'border-green-500': toast.type === 'success',
          'border-red-500': toast.type === 'error',
          'border-blue-500': toast.type === 'info',
          'border-yellow-500': toast.type === 'warning',
        }"
        (mouseenter)="pauseTimer(toast.id)"
        (mouseleave)="resumeTimer(toast.id)"
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
        <span class="flex-1 text-base text-gray-900 dark:text-gray-100 font-medium">{{ toast.message }}</span>
        <button
          class="ml-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full p-1 focus:outline-none"
          (click)="startRemoveToast(toast.id)"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <!-- Progress bar for auto-dismiss -->
        <div class="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
          <div class="h-full transition-transform ease-linear"
            [ngClass]="{
              'bg-green-500/40': toast.type === 'success',
              'bg-red-500/40': toast.type === 'error',
              'bg-blue-500/40': toast.type === 'info',
              'bg-yellow-500/40': toast.type === 'warning',
            }"
            [style.transform]="'translateX(-' + (100 - getProgress(toast.id)) + '%)'"
            [style.transition-duration.ms]="getTransitionDuration(toast.id)"
          ></div>
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
    trigger('toastAnim', [
      transition('void => enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(-20px) translateX(20px) scale(0.95)' 
        }),
        animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0) translateX(0) scale(1)' 
          })
        )
      ]),
      transition('enter => leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)', 
          style({ 
            opacity: 0, 
            transform: 'translateY(-10px) translateX(30px) scale(0.95)' 
          })
        )
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  leavingToasts = new Set<number>();
  private subscription: Subscription;
  private timers = new Map<number, { 
    timeout: any, 
    startTime: number, 
    duration: number, 
    remaining: number,
    paused: boolean 
  }>();
  private defaultDuration = 3000; // 3 seconds

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

  startRemoveToast(id: number): void {
    this.clearTimer(id);
    this.leavingToasts.add(id);
  }

  onAnimationDone(event: AnimationEvent, id: number): void {
    if (event.toState === 'leave') {
      this.leavingToasts.delete(id);
      this.toastService.remove(id);
    }
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
    const duration = this.defaultDuration;
    const timeout = setTimeout(() => {
      this.startRemoveToast(id);
    }, duration);
    
    this.timers.set(id, {
      timeout,
      startTime: Date.now(),
      duration,
      remaining: duration,
      paused: false
    });
  }
  
  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.timeout);
      this.timers.delete(id);
    }
  }
  
  pauseTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer && !timer.paused) {
      clearTimeout(timer.timeout);
      const elapsed = Date.now() - timer.startTime;
      timer.remaining = timer.duration - elapsed;
      timer.paused = true;
    }
  }
  
  resumeTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer && timer.paused) {
      timer.startTime = Date.now();
      timer.timeout = setTimeout(() => {
        this.startRemoveToast(id);
      }, timer.remaining);
      timer.paused = false;
    }
  }
  
  getProgress(id: number): number {
    const timer = this.timers.get(id);
    if (!timer) return 100;
    
    if (timer.paused) {
      const elapsed = timer.duration - timer.remaining;
      return (elapsed / timer.duration) * 100;
    }
    
    const elapsed = Date.now() - timer.startTime;
    const progress = Math.min((elapsed / timer.duration) * 100, 100);
    return progress;
  }

  getTransitionDuration(id: number): number {
    const timer = this.timers.get(id);
    if (!timer) return 0;
    
    // If paused, no transition
    if (timer.paused) return 0;
    
    // On initial load or resume, use remaining time
    return timer.remaining || this.defaultDuration;
  }
}
