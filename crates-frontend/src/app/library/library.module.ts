import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { LibraryRoutingModule } from './library-routing.module';
import { LibraryComponent } from './library.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CrateModule } from '../crate/crate.module';
import { StoreModule } from '@ngrx/store';

import * as fromLibrary from './store/reducers/library.reducer';
import { EffectsModule } from '@ngrx/effects';
import { LibraryEffects } from './store/effects/library.effects';
import { LibraryStorageEffects } from './store/effects/library-storage.effects';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    LibraryComponent
  ],
  imports: [
    CommonModule,
    LibraryRoutingModule,
    InfiniteScrollModule,
    CrateModule,
    StoreModule.forFeature('library', fromLibrary.reducer),
    EffectsModule.forFeature([LibraryEffects, LibraryStorageEffects]),
    FormsModule,
    NgOptimizedImage,
    SharedModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu
  ]
})
export class LibraryModule { }
