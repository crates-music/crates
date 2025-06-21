import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from './shared/service/user.service';
import { EffectsModule } from '@ngrx/effects';
import { UserEffects } from './store/effects/user.effects';
import { StoreModule } from '@ngrx/store';
import * as fromUser from './store/reducers/user.reducer';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { UserRoutingModule } from './user-routing.module';


@NgModule({
  declarations: [
    ProfileSettingsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserRoutingModule,
    EffectsModule.forFeature([
      UserEffects
    ]),
    StoreModule.forFeature('user', fromUser.reducer),
  ],
  providers: [
    UserService
  ]
})
export class UserModule {
}
