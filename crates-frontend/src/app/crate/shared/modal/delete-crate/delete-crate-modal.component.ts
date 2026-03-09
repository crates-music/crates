import { Component, Input } from '@angular/core';
import { Crate } from '../../model/crate.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { deleteCrate } from '../../../store/actions/delete-crate.actions';

@Component({
  selector: 'crates-delete-crate',
  templateUrl: './delete-crate-modal.component.html',
  styleUrls: ['./delete-crate-modal.component.scss']
})
export class DeleteCrateModalComponent {
  @Input()
  crate: Crate;

  constructor(private activeModal: NgbActiveModal,
              private store: Store) {
  }

  confirm(): void {
    this.store.dispatch(deleteCrate({ id: this.crate.id }));
    this.activeModal.close(true);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
