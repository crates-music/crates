import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from './shared/service/user.service';
import { EffectsModule } from '@ngrx/effects';
import { UserEffects } from './store/effects/user.effects';
import { StoreModule } from '@ngrx/store';
import * as fromUser from './store/reducers/user.reducer';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
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
