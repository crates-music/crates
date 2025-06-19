import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { CrateRoutingModule } from './crate-routing.module';
import { CrateListComponent } from './crate-list/crate-list.component';
import { CrateSelectionModal } from './shared/modal/crate-selection/crate-selection.modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CrateComponent } from './crate/crate.component';
import { StoreModule } from '@ngrx/store';
import * as fromCrate from './store/reducers/crate.reducer';
import { EffectsModule } from '@ngrx/effects';
import { CrateEffects } from './store/effects/crate.effects';
import { SharedModule } from '../shared/shared.module';
import { RemoveAlbumModalComponent } from './shared/modal/remove-album/remove-album-modal.component';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { CrateSettingsComponent } from './crate-settings/crate-settings.component';


@NgModule({
  declarations: [
    CrateListComponent,
    CrateSelectionModal,
    CrateComponent,
    RemoveAlbumModalComponent,
    CrateSettingsComponent
  ],
  imports: [
    CommonModule,
    CrateRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    StoreModule.forFeature('crate', fromCrate.reducer),
    EffectsModule.forFeature([CrateEffects]),
    SharedModule,
    NgOptimizedImage,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
  ]
})
export class CrateModule {
}
