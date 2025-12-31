import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

type ModalState = 'preview' | 'processing' | 'success' | 'error';

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
    private store: Store
  ) {
    this.preview$ = this.store.select(selectAutoCategorizePreview);
    this.result$ = this.store.select(selectAutoCategorizeResult);
    this.loading$ = this.store.select(selectAutoCategorizeLoading);
    this.error$ = this.store.select(selectAutoCategorizeError);
  }

  ngOnInit() {
    // Load preview on init
    this.store.dispatch(previewAutoCategorize());

    // Subscribe to state changes
    this.preview$.pipe(takeUntil(this.destroy$)).subscribe(preview => {
      if (preview && this.state === 'preview') {
        // Preview loaded successfully
      }
    });

    this.result$.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.state = 'success';
      }
    });

    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error && this.state !== 'preview') {
        this.state = 'error';
      }
    });
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
    this.state = 'preview';
    this.store.dispatch(previewAutoCategorize());
  }
}
