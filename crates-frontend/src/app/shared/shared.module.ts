import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthGuard } from './auth.guard';
import { LongPressDirective } from './directive/long-press.directive';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FormsModule } from '@angular/forms';
import { ListTypeToggleComponent } from './components/list-type-toggle/list-type-toggle.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';



@NgModule({
  declarations: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent,
    UserMenuComponent,
  ],
  providers: [
    AuthGuard
  ],
  exports: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent,
    UserMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule
  ]
})
export class SharedModule { }
