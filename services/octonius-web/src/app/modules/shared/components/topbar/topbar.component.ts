import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, Search, ListFilter, Plus } from 'lucide-angular'

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() showFilter = true;
  @Input() showAdd = true;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() searchValue = '';

  @Output() filter = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  onFilter() {
    this.filter.emit();
  }
  onAdd() {
    this.add.emit();
  }
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }
  onSearchClick() {
    this.search.emit('');
  }
} 