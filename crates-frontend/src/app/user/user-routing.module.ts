import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FollowerListComponent } from './follower-list/follower-list.component';
import { FollowingListComponent } from './following-list/following-list.component';
import { AuthGuard } from '../shared/auth.guard';

const routes: Routes = [
  {
    path: 'profile/settings/followers',
    component: FollowerListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile/settings/following',
    component: FollowingListComponent,
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