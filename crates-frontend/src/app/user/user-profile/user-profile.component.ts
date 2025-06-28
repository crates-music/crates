import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { User } from '../shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';
import { UserService } from '../shared/service/user.service';
import { SocialService } from '../../shared/services/social.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user$: Observable<User | null>;
  publicCrates$: Observable<Crate[]>;
  isFollowing$: Observable<boolean>;
  currentUserId$: Observable<number>;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private socialService: SocialService
  ) {
    this.currentUserId$ = this.userService.getCurrentUser().pipe(
      map(user => user?.id || 0)
    );
  }

  ngOnInit(): void {
    this.user$ = this.route.params.pipe(
      switchMap(params => {
        const handle = params['handle'];
        this.loading = true;
        this.error = false;
        
        return this.userService.getUserByHandle(handle).pipe(
          catchError(() => {
            this.error = true;
            this.loading = false;
            return of(null);
          })
        );
      })
    );

    this.publicCrates$ = this.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.userService.getUserPublicCrates(user.id).pipe(
          map(page => page.content || []),
          catchError(() => of([]))
        );
      })
    );

    this.isFollowing$ = this.user$.pipe(
      switchMap(user => {
        if (!user) return of(false);
        return this.socialService.isFollowing(user.id).pipe(
          catchError(() => of(false))
        );
      })
    );

    // Set loading to false after user$ emits
    this.user$.subscribe(user => {
      if (user !== undefined) {
        this.loading = false;
      }
    });
  }

  onFollowChange(userId: number): void {
    // Re-check following status
    this.isFollowing$ = this.socialService.isFollowing(userId).pipe(
      catchError(() => of(false))
    );
  }
}