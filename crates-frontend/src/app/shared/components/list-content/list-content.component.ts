import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { ListType } from '../../model/list-type.model';

@Component({
  selector: 'crates-list-content',
  templateUrl: './list-content.component.html',
  styleUrls: ['./list-content.component.scss']
})
export class ListContentComponent {
  @Input() items: any[] = [];
  @Input() listType: ListType = ListType.Grid;
  @Input() loading: boolean = false;
  @Input() hasNextPage: boolean = false;
  @Input() showLoadMore: boolean = true;
  @Input() loadMoreText: string = 'Load More';
  @Input() emptyStateTitle: string = 'No items found';
  @Input() emptyStateMessage: string = 'Try adjusting your search or filters.';
  @Input() showEmptyState: boolean = true;
  
  // Template refs for customization
  @Input() gridItemTemplate?: TemplateRef<any>;
  @Input() listItemTemplate?: TemplateRef<any>;
  @Input() emptyStateTemplate?: TemplateRef<any>;
  
  // Events
  @Output() loadMore = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<any>();
  @Output() itemLongPress = new EventEmitter<any>();
  @Output() itemSecondaryAction = new EventEmitter<any>();

  // Expose ListType enum to template
  ListType = ListType;

  onLoadMore(): void {
    this.loadMore.emit();
  }

  onItemClick(item: any): void {
    this.itemClick.emit(item);
  }

  onItemLongPress(item: any): void {
    this.itemLongPress.emit(item);
  }

  onItemSecondaryAction(item: any): void {
    this.itemSecondaryAction.emit(item);
  }

  trackByFn(index: number, item: any): any {
    return item.id || item.spotifyId || index;
  }

  getItemSubtitle(item: any): string {
    if (item.artists && Array.isArray(item.artists)) {
      return item.artists.map((a: any) => a.name).join(', ');
    }
    return 'Crate';
  }
}