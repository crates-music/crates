import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiscoverComponent } from './discover.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DiscoverComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiscoverRoutingModule { }