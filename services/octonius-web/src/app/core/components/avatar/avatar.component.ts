import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-shrink-0">
      <div [class]="containerClasses">
        <img *ngIf="avatarUrl" 
             [src]="avatarUrl" 
             [alt]="altText"
             class="w-full h-full object-cover" />
        <img *ngIf="!avatarUrl && !showInitials" 
             [src]="defaultAvatarUrl" 
             [alt]="altText"
             class="w-full h-full object-cover" />
        <span *ngIf="!avatarUrl && showInitials" 
              class="text-center font-medium"
              [class]="textClasses">
          {{ initials }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .avatar-container {
      transition: all 0.2s ease;
      
      // Force gradient background to show
      &.bg-gradient-to-br {
        background: linear-gradient(135deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 100%) !important;
      }
      
      // Ensure proper centering of initials
      span {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 1;
      }
    }
  `]
})
export class AvatarComponent {
  @Input() avatarUrl: string | null = null;
  @Input() initials: string = '';
  @Input() altText: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showBorder: boolean = false;
  @Input() showInitials: boolean = false; // When true, shows initials instead of default avatar

  // Default avatar URL from Octonius
  defaultAvatarUrl = 'https://media.octonius.com/assets/icon_avatar.svg';

  get containerClasses(): string {
    const sizeClasses = {
      'xs': 'w-6 h-6 text-xs',
      'sm': 'w-8 h-8 text-sm', 
      'md': 'w-10 h-10 text-sm',
      'lg': 'w-12 h-12 text-base',
      'xl': 'w-16 h-16 text-lg'
    };
    
    const baseClasses = 'rounded-full overflow-hidden bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center text-base-content/70 avatar-container';
    const borderClasses = this.showBorder ? 'border border-base-300' : '';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${borderClasses}`;
  }

  get textClasses(): string {
    const sizeClasses = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-sm', 
      'lg': 'text-base',
      'xl': 'text-lg'
    };
    
    return sizeClasses[this.size];
  }
}
