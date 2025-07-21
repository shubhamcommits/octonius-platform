import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil, fromEvent, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-infinite-scroll-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Search Bar -->
      <div class="relative" *ngIf="showSearch">
        <input 
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchChange()"
          placeholder="{{ searchPlaceholder }}"
          class="input input-bordered w-full pl-14 pr-10 h-12 bg-base-200/50 border-base-300 focus:bg-base-100 focus:border-primary transition-all duration-200"
        />
        <lucide-icon name="Search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40"></lucide-icon>
        <button 
          *ngIf="searchTerm"
          (click)="clearSearch()"
          class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle hover:bg-base-300"
        >
          <lucide-icon name="X" class="w-4 h-4"></lucide-icon>
        </button>
      </div>

      <!-- List Container -->
      <div 
        #scrollContainer
        class="overflow-y-auto rounded-lg border border-base-300/50"
        [style.height]="height"
        (scroll)="onScroll()"
      >
        <!-- Content -->
        <ng-content></ng-content>
        
        <!-- Loading Indicator -->
        <div *ngIf="loading && !isInitialLoad" class="text-center py-4">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
        
        <!-- Initial Loading -->
        <div *ngIf="loading && isInitialLoad" class="space-y-3">
          <div *ngFor="let _ of [1,2,3,4,5]" class="animate-pulse">
            <div class="h-16 bg-base-300 rounded-lg"></div>
          </div>
        </div>
        
        <!-- No Results -->
        <div *ngIf="!loading && items.length === 0 && searchTerm" class="text-center py-8">
          <lucide-icon name="SearchX" class="w-12 h-12 text-base-content/30 mx-auto mb-3"></lucide-icon>
          <p class="text-base-content/60">No results found for "{{ searchTerm }}"</p>
        </div>
        
        <!-- Empty State -->
        <div *ngIf="!loading && items.length === 0 && !searchTerm" class="text-center py-8">
          <ng-content select="[empty-state]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class InfiniteScrollListComponent implements OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() loading = false;
  @Input() hasMore = true;
  @Input() height = '400px';
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() threshold = 200; // pixels from bottom to trigger load
  
  @Output() loadMore = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  searchTerm = '';
  isInitialLoad = true;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  ngOnInit() {
    // Setup search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.search.emit(term);
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onScroll() {
    if (this.loading || !this.hasMore) return;
    
    const element = this.scrollContainer.nativeElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    
    if (scrollHeight - scrollPosition <= this.threshold) {
      this.isInitialLoad = false;
      this.loadMore.emit();
    }
  }
  
  onSearchChange() {
    this.isInitialLoad = true;
    this.searchSubject.next(this.searchTerm);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange();
  }
} 