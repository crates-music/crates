import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component } from '@angular/core';
import { CrateService } from '../../crate.service';
import { Crate } from '../../model/crate.model';
import { tap } from 'rxjs';
import { Pageable } from '../../../../shared/model/pageable.model';
import { Page } from '../../../../shared/model/page.model';

@Component({
  selector: 'crate-crate-selection-modal',
  templateUrl: './crate-selection-modal.html',
  styleUrls: ['./crate-selection.modal.scss']
})
export class CrateSelectionModal {
  cratePage: Page<Crate>;
  creating = false;
  crateName: string;

  constructor(private activeModal: NgbActiveModal,
              private crateService: CrateService) {
    this.crateService.getCrates(Pageable.of(0, 10)).pipe(
      tap(cratePage => (this.cratePage = cratePage)),
    ).subscribe();
  }

  createCrate(name: string) {
    this.crateService.createCrate(name).pipe(
      tap(crate => {
        this.cratePage.content.unshift(crate);
        this.creating = false;
      })
    ).subscribe();
  }

  crateCrateClicked() {
    this.creating = true;
  }

  selectCrate(crate: Crate) {
    this.activeModal.close(crate);
  }
}
