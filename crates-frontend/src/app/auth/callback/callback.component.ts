import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { Store } from '@ngrx/store';

@Component({
  selector: 'crate-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {
  constructor(private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private router: Router,
              private store: Store) {
  }

  ngOnInit(): void {
    const token = this.activatedRoute.snapshot.queryParams['token'];
    if (!token) {
      this.router.navigate(['/auth', 'login']);
      return;
    }
    // AuthService now dispatches loginSuccess action which triggers loadUser via effects
    this.authService.setToken(token);
    this.router.navigate(['/crate', 'list']);
  }
}
