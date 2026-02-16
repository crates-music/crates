import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import {
  AlbumSort,
  SortOption,
  SortDirection,
  SORT_OPTION_LABELS,
  getDefaultDirection
} from '../../model/album-sort.model';

@Component({
  selector: 'crates-sort-toggle',
  templateUrl: './sort-toggle.component.html',
  styleUrls: ['./sort-toggle.component.scss']
})
export class SortToggleComponent {
  @Input() sort: AlbumSort;
  @Output() sortChange = new EventEmitter<AlbumSort>();

  sortOptions = Object.values(SortOption);
  labels = SORT_OPTION_LABELS;
  dropdownOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  selectOption(option: SortOption): void {
    if (this.sort.option === option) {
      // Toggle direction
      const newDirection = this.sort.direction === SortDirection.Asc
        ? SortDirection.Desc : SortDirection.Asc;
      this.sortChange.emit({ option, direction: newDirection });
    } else {
      this.sortChange.emit({ option, direction: getDefaultDirection(option) });
    }
    this.closeDropdown();
  }

  get isAsc(): boolean {
    return this.sort?.direction === SortDirection.Asc;
  }

  getDirectionIcon(option: SortOption): string {
    if (this.sort?.option !== option) return '';
    return this.sort.direction === SortDirection.Asc ? 'bi-arrow-up' : 'bi-arrow-down';
  }
}
