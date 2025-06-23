import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AuthGuard } from './auth.guard';
import { LongPressDirective } from './directive/long-press.directive';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FormsModule } from '@angular/forms';
import { ListTypeToggleComponent } from './components/list-type-toggle/list-type-toggle.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { ViewHeaderComponent } from './components/view-header/view-header.component';
import { ViewLayoutComponent } from './components/view-layout/view-layout.component';
import { ListContentComponent } from './components/list-content/list-content.component';



@NgModule({
  declarations: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent,
    UserMenuComponent,
    UserHeaderComponent,
    ViewHeaderComponent,
    ViewLayoutComponent,
    ListContentComponent,
  ],
  providers: [
    AuthGuard
  ],
  exports: [
    LongPressDirective,
    SearchbarComponent,
    ListTypeToggleComponent,
    WelcomeComponent,
    UserMenuComponent,
    UserHeaderComponent,
    ViewHeaderComponent,
    ViewLayoutComponent,
    ListContentComponent,
    InfiniteScrollModule
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgbModule,
    InfiniteScrollModule
  ]
})
export class SharedModule { }
