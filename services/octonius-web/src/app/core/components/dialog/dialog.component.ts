import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogConfig } from '../../services/dialog.service';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from '../../../modules/shared/shared.module';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div *ngIf="config" 
         class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
         (click)="onBackdropClick($event)">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"></div>
      
      <!-- Dialog Content -->
      <div class="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md 
                  animate-scale-in"
           (click)="$event.stopPropagation()">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start gap-4 mb-4">
            <div *ngIf="config.icon || getDefaultIcon()" 
                 class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                 [ngClass]="getIconColorClass()">
              <lucide-icon [name]="config.icon || getDefaultIcon()" 
                           class="w-6 h-6"></lucide-icon>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-base-content">{{ config.title }}</h3>
              <p class="mt-1 text-sm text-base-content/70">{{ config.message }}</p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 mt-6" [ngClass]="{'justify-end': config.type === 'confirm', 'justify-center': config.type !== 'confirm'}">
            <button *ngIf="config.type === 'confirm'"
                    type="button"
                    class="btn btn-ghost"
                    (click)="onCancel()">
              {{ config.cancelText }}
            </button>
            <button type="button"
                    class="btn"
                    [ngClass]="getConfirmButtonClass()"
                    (click)="onConfirm()">
              {{ config.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-fade-in {
      animation: fadeIn 200ms ease-out;
    }
    
    .animate-scale-in {
      animation: scaleIn 200ms ease-out;
    }
  `]
})
export class DialogComponent implements OnInit, OnDestroy {
  config: DialogConfig | null = null;
  private destroy$ = new Subject<void>();

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.dialogService.dialog$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm(): void {
    this.dialogService.close(true);
  }

  onCancel(): void {
    this.dialogService.close(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.config?.type === 'confirm') {
      this.onCancel();
    }
  }

  getDefaultIcon(): string {
    switch (this.config?.type) {
      case 'error':
        return 'AlertCircle';
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'confirm':
        return 'HelpCircle';
      case 'info':
        return 'Info';
      default:
        return 'Info';
    }
  }

  getIconColorClass(): string {
    switch (this.config?.type) {
      case 'error':
        return 'bg-error/20 text-error';
      case 'success':
        return 'bg-success/20 text-success';
      case 'warning':
        return 'bg-warning/20 text-warning';
      case 'confirm':
        return 'bg-primary/20 text-primary';
      case 'info':
        return 'bg-info/20 text-info';
      default:
        return 'bg-info/20 text-info';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.config?.type) {
      case 'error':
        return 'btn-error';
      case 'success':
        return 'btn-success';
      case 'warning':
        return 'btn-warning';
      default:
        return 'btn-primary';
    }
  }
} 