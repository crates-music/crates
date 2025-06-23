import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { ListType } from '../../model/list-type.model';

@Component({
  selector: 'crates-view-layout',
  templateUrl: './view-layout.component.html',
  styleUrls: ['./view-layout.component.scss']
})
export class ViewLayoutComponent {
  // Header configuration
  @Input() title: string = '';
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search...';
  @Input() showListToggle: boolean = true;
  @Input() listType: ListType = ListType.Grid;
  @Input() showSyncButton: boolean = false;
  @Input() syncDisabled: boolean = false;
  @Input() syncLoading: boolean = false;
  @Input() showFilters: boolean = false;
  @Input() showSettings: boolean = false;
  
  // Filter inputs
  @Input() hideCrated: boolean = false;
  @Input() hideCratedLabel: string = 'Hide albums already in crates';
  
  // Events
  @Output() search = new EventEmitter<string>();
  @Output() listTypeToggle = new EventEmitter<ListType>();
  @Output() sync = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<boolean>();

  // Expose ListType enum to template
  ListType = ListType;

  onSearch(query: string): void {
    this.search.emit(query);
  }

  onListTypeToggle(listType: ListType): void {
    this.listTypeToggle.emit(listType);
  }

  onSync(): void {
    this.sync.emit();
  }

  onSettings(): void {
    this.settingsClick.emit();
  }

  onFilterChange(checked: boolean): void {
    this.filterChange.emit(checked);
  }
}