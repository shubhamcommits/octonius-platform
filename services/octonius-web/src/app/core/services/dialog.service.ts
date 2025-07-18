import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'error' | 'success' | 'warning' | 'info';
  icon?: string;
}

export interface DialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<DialogConfig | null>();
  private resultSubject = new Subject<DialogResult>();

  dialog$ = this.dialogSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  confirm(config: Partial<DialogConfig>): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const fullConfig: DialogConfig = {
        title: config.title || 'Confirm',
        message: config.message || 'Are you sure?',
        confirmText: config.confirmText || 'OK',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'confirm',
        icon: config.icon
      };

      this.dialogSubject.next(fullConfig);

      const subscription = this.result$.subscribe(result => {
        observer.next(result.confirmed);
        observer.complete();
        subscription.unsubscribe();
      });
    });
  }

  alert(config: Partial<DialogConfig>): Observable<void> {
    return new Observable<void>(observer => {
      const fullConfig: DialogConfig = {
        title: config.title || 'Alert',
        message: config.message || '',
        confirmText: config.confirmText || 'OK',
        type: 'alert',
        icon: config.icon
      };

      this.dialogSubject.next(fullConfig);

      const subscription = this.result$.subscribe(() => {
        observer.next();
        observer.complete();
        subscription.unsubscribe();
      });
    });
  }

  error(message: string, title?: string): Observable<void> {
    return this.alert({
      title: title || 'Error',
      message,
      type: 'error',
      icon: 'AlertCircle'
    });
  }

  success(message: string, title?: string): Observable<void> {
    return this.alert({
      title: title || 'Success',
      message,
      type: 'success',
      icon: 'CheckCircle'
    });
  }

  warning(message: string, title?: string): Observable<void> {
    return this.alert({
      title: title || 'Warning',
      message,
      type: 'warning',
      icon: 'AlertTriangle'
    });
  }

  info(message: string, title?: string): Observable<void> {
    return this.alert({
      title: title || 'Information',
      message,
      type: 'info',
      icon: 'Info'
    });
  }

  close(confirmed: boolean = false): void {
    this.resultSubject.next({ confirmed });
    this.dialogSubject.next(null);
  }
} 