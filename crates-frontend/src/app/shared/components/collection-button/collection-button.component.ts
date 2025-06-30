import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as CollectionActions from '../../store/actions/collection.actions';
import { selectCrateCollectionStatus, selectCrateCollectionLoading } from '../../store/selectors/collection.selectors';

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

  inCollection$: Observable<boolean>;
  loading$: Observable<boolean>;
  private currentInCollectionState: boolean = false;

  private destroy$ = new Subject<boolean>();

  constructor(private store: Store) {}

  ngOnInit() {
    if (!this.crateId) {
      console.error('CollectionButtonComponent: crateId is required');
      return;
    }
    
    // Set up observables
    this.inCollection$ = this.store.select(selectCrateCollectionStatus(this.crateId)).pipe(
      map(status => status.inCollection)
    );
    this.loading$ = this.store.select(selectCrateCollectionLoading(this.crateId));
    
    // Track current state to avoid subscription loops
    this.inCollection$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(inCollection => {
      this.currentInCollectionState = inCollection;
    });
    
    // Load collection status
    this.store.dispatch(CollectionActions.loadCollectionStatus({ crateId: this.crateId }));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleCollection() {
    // Use the tracked state instead of subscribing to observable
    if (this.currentInCollectionState) {
      this.store.dispatch(CollectionActions.removeCrateFromCollection({ crateId: this.crateId }));
    } else {
      this.store.dispatch(CollectionActions.addCrateToCollection({ crateId: this.crateId }));
    }
    
    // Remove focus to prevent confusing visual state
    if (this.collectionButton) {
      this.collectionButton.nativeElement.blur();
    }
  }

  get buttonClass(): string {
    const sizeClass = this.size === 'sm' ? 'btn-sm' : this.size === 'lg' ? 'btn-lg' : '';
    const variantClass = this.variant === 'primary' ? 'btn-primary' : 'btn-outline-primary';
    return `btn ${variantClass} ${sizeClass}`.trim();
  }

  getButtonText(inCollection: boolean, loading: boolean): string {
    if (loading) {
      return inCollection ? 'Removing...' : 'Adding...';
    }
    return inCollection ? 'Remove from Collection' : 'Add to Collection';
  }

  getButtonIcon(inCollection: boolean): string {
    return inCollection ? 'bi-bookmark-dash' : 'bi-bookmark-plus';
  }
}