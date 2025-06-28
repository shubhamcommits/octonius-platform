import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  private toastId = 0;
  private recentToasts = new Map<string, number>(); // Track recent toasts by message

  constructor() {}

  getToasts(): Observable<Toast[]> {
    return this.toasts.asObservable();
  }

  show(toast: Omit<Toast, 'id'>): void {
    // Check if this exact message was shown recently (within 100ms)
    const messageKey = `${toast.type}-${toast.message}`;
    const lastShown = this.recentToasts.get(messageKey);
    const now = Date.now();
    
    if (lastShown && (now - lastShown) < 100) {
      // Skip duplicate toast
      return;
    }
    
    // Track this toast
    this.recentToasts.set(messageKey, now);
    
    // Clean up old entries after 1 second
    setTimeout(() => {
      this.recentToasts.delete(messageKey);
    }, 1000);
    
    const id = ++this.toastId;
    const newToast = { ...toast, id };
    const currentToasts = this.toasts.value;
    this.toasts.next([...currentToasts, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration || 3000);
    }
  }

  success(message: string, duration?: number): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration?: number): void {
    this.show({ type: 'error', message, duration });
  }

  info(message: string, duration?: number): void {
    this.show({ type: 'info', message, duration });
  }

  warning(message: string, duration?: number): void {
    this.show({ type: 'warning', message, duration });
  }

  remove(id: number): void {
    const currentToasts = this.toasts.value;
    this.toasts.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toasts.next([]);
    this.recentToasts.clear();
  }
} 