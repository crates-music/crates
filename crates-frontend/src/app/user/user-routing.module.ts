import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FollowerListWrapperComponent } from './follower-list-wrapper/follower-list-wrapper.component';
import { FollowingListWrapperComponent } from './following-list-wrapper/following-list-wrapper.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: 'profile/settings/followers',
    component: FollowerListWrapperComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile/settings/following',
    component: FollowingListWrapperComponent,
    canActivate: [AuthGuard]
  },
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