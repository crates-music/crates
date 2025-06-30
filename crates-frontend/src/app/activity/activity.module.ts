import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ActivityRoutingModule } from './activity-routing.module';
import { SharedModule } from '../shared/shared.module';

import { ActivityComponent } from './activity.component';
import { ActivityItemComponent } from './activity-item/activity-item.component';

@NgModule({
  declarations: [
    ActivityComponent,
    ActivityItemComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    ActivityRoutingModule,
    SharedModule
  ]
})
export class ActivityModule { }