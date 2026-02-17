import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from './shared/service/user.service';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserRoutingModule } from './user-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    ProfileSettingsComponent,
    FeedbackComponent,
    UserProfileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
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
