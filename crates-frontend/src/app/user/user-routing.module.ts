import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: 'profile/settings',
    component: ProfileSettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: UserProfileComponent
  },
  {
    path: '',
    component: UserProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }