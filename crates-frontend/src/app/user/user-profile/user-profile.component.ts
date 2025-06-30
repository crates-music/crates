import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { map, takeUntil, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { User } from '../shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';
import * as UserActions from '../store/actions/load-user.actions';
import * as SocialActions from '../../shared/store/actions/social.actions';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import { selectUser } from '../store/selectors/user.selectors';
import { 
  selectViewedUser, 
  selectViewedUserLoading, 
  selectViewedUserCrates, 
  selectViewedUserCollection 
} from '../store/selectors/user.selectors';
import { selectUserFollowStatus } from '../../shared/store/selectors/social.selectors';
import { selectCrateCollectionStatus } from '../../shared/store/selectors/collection.selectors';
import * as CollectionActions from '../../shared/store/actions/collection.actions';
import { ListType } from '../../shared/model/list-type.model';
import { selectCurrentNavigationContext } from '../../shared/store/selectors/navigation.selectors';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  publicCrates$: Observable<Crate[]>;
  collectionCrates$: Observable<Crate[]>;
  isFollowing$: Observable<boolean>;
  currentUserId$: Observable<number>;
  loading$: Observable<boolean>;
  activeTab: 'authored' | 'collection' = 'authored';
  listType: ListType = ListType.Grid;
  private destroy$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {
    this.currentUserId$ = this.store.select(selectUser).pipe(
      map(user => user?.id || 0)
    );
  }

  ngOnInit(): void {
    // Set up selectors
    this.user$ = this.store.select(selectViewedUser);
    this.loading$ = this.store.select(selectViewedUserLoading);
    this.publicCrates$ = this.store.select(selectViewedUserCrates);
    this.collectionCrates$ = this.store.select(selectViewedUserCollection);


    // Listen to route changes and dispatch actions
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const userId = +params['id'];
      if (userId) {
        // Clear previous user profile data
        this.store.dispatch(UserActions.clearUserProfile());
        
        // Determine navigation context based on whether viewing own profile
        this.currentUserId$.pipe(takeUntil(this.destroy$)).subscribe(currentUserId => {
          if (userId === currentUserId) {
            // Viewing own profile - set context to 'profile'
            this.store.dispatch(NavigationActions.setNavigationContext({ context: 'profile' }));
          } else {
            // Viewing someone else's profile - keep current context or default to 'discover'
            this.store.select(selectCurrentNavigationContext).pipe(takeUntil(this.destroy$)).subscribe(currentContext => {
              if (!currentContext) {
                // No context set (direct navigation), default to 'discover'
                this.store.dispatch(NavigationActions.setNavigationContext({ context: 'discover' }));
              }
              // If context is already set (e.g., from discover), keep it
            });
          }
        });
        
        // Load user and their data
        this.store.dispatch(UserActions.loadUserById({ userId }));
        this.store.dispatch(UserActions.loadUserPublicCrates({ userId }));
        this.store.dispatch(UserActions.loadUserPublicCollection({ userId }));
        this.store.dispatch(SocialActions.loadFollowStatus({ userId }));
      }
    });


    // Set up follow status
    this.isFollowing$ = this.user$.pipe(
      map(user => user?.id),
      switchMap(userId => {
        if (!userId) return of(false);
        return this.store.select(selectUserFollowStatus(userId)).pipe(
          map(status => status.isFollowing)
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.store.dispatch(UserActions.clearUserProfile());
  }

  setActiveTab(tab: 'authored' | 'collection'): void {
    this.activeTab = tab;
  }

  onFollowChange(userId: number): void {
    // The follow button component should dispatch actions directly
    // This method can be removed or used to refresh follow status
    this.store.dispatch(SocialActions.loadFollowStatus({ userId }));
  }

  getFirstLetter(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  openCrate(crate: Crate): void {
    // Determine if this is own crate or discovered crate and track navigation context
    this.currentUserId$.pipe(takeUntil(this.destroy$)).subscribe(currentUserId => {
      const isOwnCrate = crate.user?.id === currentUserId;
      
      this.store.select(selectCurrentNavigationContext).pipe(takeUntil(this.destroy$)).subscribe(currentContext => {
        this.store.dispatch(NavigationActions.trackCrateNavigation({ 
          crateId: crate.id, 
          fromContext: currentContext || 'discover', 
          isOwnCrate 
        }));
      });
    });
    
    this.router.navigate(['/crate', crate.id]);
  }

  isOwnedCrate(crate: Crate): boolean {
    // Check if this crate belongs to the current user
    // For user profiles, crates shown are never owned by current user (they're viewing someone else)
    return false;
  }

  isCrateInCollection(crate: Crate): boolean {
    return crate.collected;
  }

  toggleCrateCollection(crate: Crate): void {
    if (crate.collected) {
      this.store.dispatch(CollectionActions.removeCrateFromCollection({ crateId: crate.id }));
    } else {
      this.store.dispatch(CollectionActions.addCrateToCollection({ crateId: crate.id }));
    }
  }
}