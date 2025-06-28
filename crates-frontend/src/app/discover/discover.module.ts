import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DiscoverRoutingModule } from './discover-routing.module';
import { SharedModule } from '../shared/shared.module';

import { DiscoverComponent } from './discover.component';
import { UserSearchComponent } from './user-search/user-search.component';
import { CrateSearchComponent } from './crate-search/crate-search.component';

@NgModule({
  declarations: [
    DiscoverComponent,
    UserSearchComponent,
    CrateSearchComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    DiscoverRoutingModule,
    SharedModule
  ]
})
export class DiscoverModule { }