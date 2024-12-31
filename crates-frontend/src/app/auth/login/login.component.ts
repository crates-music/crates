import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'crate-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  login() {
    window.location.href = environment.baseUri + '/v1/auth/login';
  }
}
