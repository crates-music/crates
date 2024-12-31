import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthGuard } from './auth.guard';
import { LongPressDirective } from './directive/long-press.directive';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FormsModule } from '@angular/forms';
import { ListTypeToggleComponent } from './components/list-type-toggle/list-type-toggle.component';
import { WelcomeComponent } from './components/welcome/welcome.component';



@NgModule({
  declarations: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent,
  ],
  providers: [
    AuthGuard
  ],
  exports: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class SharedModule { }
