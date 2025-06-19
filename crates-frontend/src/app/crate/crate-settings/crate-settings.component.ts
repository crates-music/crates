import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, tap } from 'rxjs';
import { Crate } from '../shared/model/crate.model';
import { selectCrate } from '../store/selectors/crate.selectors';
import { loadCrate } from '../store/actions/load-crates.actions';
import { updateCrate } from '../store/actions/update-crate.actions';

@Component({
  selector: 'crates-crate-settings',
  templateUrl: './crate-settings.component.html',
  styleUrls: ['./crate-settings.component.scss']
})
export class CrateSettingsComponent implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  crate: Crate;
  destroy$ = new Subject<boolean>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private store: Store
  ) {
    this.settingsForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      publicCrate: [true]
    });
  }

  ngOnInit(): void {
    this.loadCrate();
    
    this.store.select(selectCrate).pipe(
      tap(crate => {
        if (crate) {
          this.crate = crate;
          this.settingsForm.patchValue({
            name: crate.name,
            publicCrate: crate.publicCrate
          });
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadCrate(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    this.store.dispatch(loadCrate({ id }));
  }

  onSave(): void {
    if (this.settingsForm.valid) {
      const formValue = this.settingsForm.value;
      this.store.dispatch(updateCrate({
        id: this.crate.id,
        crateUpdate: {
          name: formValue.name,
          publicCrate: formValue.publicCrate
        }
      }));
      this.router.navigate(['/crate', this.crate.id]);
    }
  }

  onCancel(): void {
    this.router.navigate(['/crate', this.crate.id]);
  }
}
