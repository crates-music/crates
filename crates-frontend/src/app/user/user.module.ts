import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from './shared/service/user.service';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserRoutingModule } from './user-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    ProfileSettingsComponent,
    UserProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserRoutingModule,
    SharedModule,
  ],
  providers: [
    UserService
  ]
})
export class UserModule {
}
