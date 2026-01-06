import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil, switchMap, filter, take, tap } from 'rxjs/operators';
import {
  previewAutoCategorize,
  executeAutoCategorize,
  resetAutoCategorize
} from '../../../store/actions/auto-categorize.actions';
import {
  selectAutoCategorizePreview,
  selectAutoCategorizeResult,
  selectAutoCategorizeLoading,
  selectAutoCategorizeError
} from '../../../store/selectors/auto-categorize.selectors';
import { AutoCategorizePreview, AutoCategorizeResult } from '../../model/auto-categorize.model';
import { Library, LibraryState } from '../../../../library/shared/model/library.model';
import { LibraryService } from '../../../../library/shared/services/library.service';

type ModalState = 'waiting-for-library' | 'analyzing' | 'preview' | 'processing' | 'success' | 'error';

@Component({
  selector: 'crates-auto-categorize-modal',
  templateUrl: './auto-categorize.modal.html',
  styleUrls: ['./auto-categorize.modal.scss']
})
export class AutoCategorizeModal implements OnInit, OnDestroy {
  state: ModalState = 'preview';

  preview$: Observable<AutoCategorizePreview | null>;
  result$: Observable<AutoCategorizeResult | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(
    public activeModal: NgbActiveModal,
    private store: Store,
    private libraryService: LibraryService
  ) {
    this.preview$ = this.store.select(selectAutoCategorizePreview);
    this.result$ = this.store.select(selectAutoCategorizeResult);
    this.loading$ = this.store.select(selectAutoCategorizeLoading);
    this.error$ = this.store.select(selectAutoCategorizeError);
  }

  ngOnInit() {
    // Start by checking library state
    this.checkLibraryStateAndProceed();

    // Subscribe to result changes
    this.result$.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.state = 'success';
      }
    });

    // Subscribe to error changes
    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error && this.state !== 'preview' && this.state !== 'waiting-for-library') {
        this.state = 'error';
      }
    });

    // Subscribe to preview success
    this.preview$.pipe(
      filter(preview => preview != null),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.state = 'preview';
    });
  }

  private checkLibraryStateAndProceed() {
    this.state = 'waiting-for-library';

    // Poll library state every 2 seconds until ready
    timer(0, 2000).pipe(
      switchMap(() => this.libraryService.getLibrary()),
      filter(library => this.isLibraryReady(library)),
      take(1),
      tap(() => {
        // Library ready, start analysis
        this.state = 'analyzing';
        this.store.dispatch(previewAutoCategorize());
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private isLibraryReady(library: Library): boolean {
    // Wait for FULL library sync to complete
    return library.state === LibraryState.Updated ||
           library.state === LibraryState.Imported;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(resetAutoCategorize());
  }

  confirm() {
    this.state = 'processing';
    this.store.dispatch(executeAutoCategorize());
  }

  cancel() {
    this.activeModal.dismiss('cancelled');
  }

  close() {
    this.activeModal.close('success');
  }

  retry() {
    this.state = 'waiting-for-library';
    this.checkLibraryStateAndProceed();
  }
}
