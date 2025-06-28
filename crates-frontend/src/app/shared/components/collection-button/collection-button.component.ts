import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-collection-button',
  templateUrl: './collection-button.component.html',
  styleUrls: ['./collection-button.component.scss']
})
export class CollectionButtonComponent implements OnInit, OnDestroy {
  @Input() crateId!: number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'outline' = 'outline';

  @ViewChild('collectionButton') collectionButton!: ElementRef<HTMLButtonElement>;

  inCollection = false;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<boolean>();

  constructor(private collectionService: CollectionService) {}

  ngOnInit() {
    if (!this.crateId) {
      console.error('CollectionButtonComponent: crateId is required');
      return;
    }
    
    this.loadCollectionStatus();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadCollectionStatus() {
    this.collectionService.getCollectionStatus(this.crateId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading collection status:', error);
        this.error = 'Failed to load status';
        return of({ inCollection: false });
      })
    ).subscribe(status => {
      this.inCollection = status.inCollection;
    });
  }

  toggleCollection() {
    if (this.loading) return;
    
    this.loading = true;
    this.error = null;
    
    const action = this.inCollection 
      ? this.collectionService.removeCrateFromCollection(this.crateId)
      : this.collectionService.addCrateToCollection(this.crateId);
    
    action.pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error toggling collection:', error);
        if (error.status === 400 && error.error?.message) {
          this.error = error.error.message;
        } else {
          this.error = this.inCollection ? 'Failed to remove from collection' : 'Failed to add to collection';
        }
        this.loading = false;
        return of(null);
      })
    ).subscribe(result => {
      if (result !== null) {
        this.inCollection = !this.inCollection;
      }
      this.loading = false;
      
      // Remove focus to prevent confusing visual state
      if (this.collectionButton) {
        this.collectionButton.nativeElement.blur();
      }
    });
  }

  get buttonClass(): string {
    const sizeClass = this.size === 'sm' ? 'btn-sm' : this.size === 'lg' ? 'btn-lg' : '';
    const variantClass = this.variant === 'primary' ? 'btn-primary' : 'btn-outline-primary';
    return `btn ${variantClass} ${sizeClass}`.trim();
  }

  get buttonText(): string {
    if (this.loading) {
      return this.inCollection ? 'Removing...' : 'Adding...';
    }
    return this.inCollection ? 'Remove from Collection' : 'Add to Collection';
  }

  get buttonIcon(): string {
    return this.inCollection ? 'bi-bookmark-dash' : 'bi-bookmark-plus';
  }
}