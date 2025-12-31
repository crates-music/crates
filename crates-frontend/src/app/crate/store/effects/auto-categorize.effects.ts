import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AutoCategorizeService } from '../../shared/auto-categorize.service';
import {
  previewAutoCategorize,
  previewAutoCategorizeSuccess,
  previewAutoCategorizeFailure,
  executeAutoCategorize,
  executeAutoCategorizeSuccess,
  executeAutoCategorizeFailure
} from '../actions/auto-categorize.actions';
import { reloadCrates } from '../actions/load-crates.actions';
import { catchError, exhaustMap, map, of, withLatestFrom } from 'rxjs';
import { Pageable } from '../../../shared/model/pageable.model';
import { Store } from '@ngrx/store';
import { selectAutoCategorizePreview } from '../selectors/auto-categorize.selectors';

@Injectable({
  providedIn: 'root'
})
export class AutoCategorizeEffects {

  // Preview effect
  previewAutoCategorize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewAutoCategorize),
      exhaustMap(() =>
        this.autoCategorizeService.preview().pipe(
          map(preview => previewAutoCategorizeSuccess({ preview })),
          catchError(error => {
            console.error('Preview auto-categorize failed', error);
            return of(previewAutoCategorizeFailure({
              error: error.error?.message || 'Failed to preview auto-categorization'
            }));
          })
        )
      )
    )
  );

  // Execute effect
  executeAutoCategorize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(executeAutoCategorize),
      withLatestFrom(this.store.select(selectAutoCategorizePreview)),
      exhaustMap(([_, preview]) =>
        this.autoCategorizeService.execute(preview?.proposals).pipe(
          map(result => executeAutoCategorizeSuccess({ result })),
          catchError(error => {
            console.error('Execute auto-categorize failed', error);
            return of(executeAutoCategorizeFailure({
              error: error.error?.message || 'Failed to execute auto-categorization'
            }));
          })
        )
      )
    )
  );

  // Reload crates after successful execution
  reloadCratesAfterSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(executeAutoCategorizeSuccess),
      map(() => reloadCrates({ pageable: Pageable.of(0, 20) }))
    )
  );

  constructor(
    private actions$: Actions,
    private autoCategorizeService: AutoCategorizeService,
    private store: Store
  ) {}
}
