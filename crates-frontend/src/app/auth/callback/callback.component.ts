import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { Store } from '@ngrx/store';
import { loadUser } from '../../user/store/actions/load-user.actions';

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
    this.authService.setToken(token);
    this.store.dispatch(loadUser());
    this.router.navigate(['/crate', 'list']);
  }
}
