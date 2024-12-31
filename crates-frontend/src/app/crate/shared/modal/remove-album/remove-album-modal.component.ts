import { Component, Input } from '@angular/core';
import { Crate } from '../../model/crate.model';
import { Album } from '../../../../library/shared/model/album.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { removeAlbumFromCrate } from '../../../store/actions/crate-album.actions';

@Component({
  selector: 'crates-remove-album',
  templateUrl: './remove-album-modal.component.html',
  styleUrls: ['./remove-album-modal.component.scss']
})
export class RemoveAlbumModalComponent {
  @Input()
  crate: Crate;

  @Input()
  album: Album;

  constructor(private activeModal: NgbActiveModal,
              private store: Store) {
  }

  confirm(): void {
    this.store.dispatch(removeAlbumFromCrate({ crate: this.crate, album: this.album }));
    this.activeModal.close(true);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
