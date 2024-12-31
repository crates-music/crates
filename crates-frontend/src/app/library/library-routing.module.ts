import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LibraryComponent } from './library.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LibraryComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LibraryRoutingModule {
}
