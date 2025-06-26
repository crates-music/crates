import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, tap, Observable } from 'rxjs';
import { Crate } from '../shared/model/crate.model';
import { selectCrate, selectCrateLoading, selectCrateError } from '../store/selectors/crate.selectors';
import { loadCrate } from '../store/actions/load-crates.actions';
import { updateCrate, updateCrateResult } from '../store/actions/update-crate.actions';
import { ApiError } from '../../shared/model/api-error.model';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'crates-crate-settings',
  templateUrl: './crate-settings.component.html',
  styleUrls: ['./crate-settings.component.scss']
})
export class CrateSettingsComponent implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  crate: Crate;
  isLoading$: Observable<boolean>;
  error$: Observable<ApiError | undefined>;
  successMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private store: Store,
    private actions$: Actions
  ) {
    this.settingsForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(300)]],
      publicCrate: [true]
    });
  }

  ngOnInit(): void {
    this.isLoading$ = this.store.select(selectCrateLoading);
    this.error$ = this.store.select(selectCrateError);
    
    this.loadCrate();
    
    this.store.select(selectCrate).pipe(
      tap(crate => {
        if (crate) {
          this.crate = crate;
          this.settingsForm.patchValue({
            name: crate.name,
            description: crate.description || '',
            publicCrate: crate.publicCrate
          });
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe();
    
    // Listen for successful crate updates
    this.actions$.pipe(
      ofType(updateCrateResult),
      takeUntil(this.destroy$)
    ).subscribe(action => {
      if (action.response.success) {
        this.successMessage = 'Crate updated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        // Navigate back after successful update
        setTimeout(() => this.router.navigate(['/crate', this.crate.id]), 1000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCrate(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    this.store.dispatch(loadCrate({ id }));
  }

  onSave(): void {
    if (this.settingsForm.valid) {
      this.successMessage = '';
      const formValue = this.settingsForm.value;
      this.store.dispatch(updateCrate({
        id: this.crate.id,
        crateUpdate: {
          name: formValue.name?.trim(),
          description: formValue.description?.trim() || null,
          publicCrate: formValue.publicCrate
        }
      }));
    }
  }

  onCancel(): void {
    this.router.navigate(['/crate', this.crate.id]);
  }

  get nameErrors() {
    const control = this.settingsForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Crate name is required';
      }
      if (control.errors['maxlength']) {
        return 'Crate name cannot exceed 255 characters';
      }
    }
    return null;
  }

  get descriptionErrors() {
    const control = this.settingsForm.get('description');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) {
        return 'Description must be 300 characters or less';
      }
    }
    return null;
  }

  get descriptionCharacterCount(): number {
    return this.settingsForm.get('description')?.value?.length || 0;
  }
}
