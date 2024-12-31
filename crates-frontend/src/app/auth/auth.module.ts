import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { CallbackComponent } from './callback/callback.component';
import { AuthService } from './auth.service';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    LoginComponent,
    CallbackComponent
  ],
  providers: [
    AuthService,
  ],
    imports: [
        CommonModule,
        AuthRoutingModule,
        SharedModule
    ]
})
export class AuthModule { }
