import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CrateListComponent } from './crate-list/crate-list.component';
import { CrateComponent } from './crate/crate.component';
import { CrateSettingsComponent } from './crate-settings/crate-settings.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: 'list',
    component: CrateListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id/settings',
    component: CrateSettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: CrateComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CrateRoutingModule {
}
