import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, fromEvent } from 'rxjs';
import { takeUntil, throttleTime, filter, map } from 'rxjs/operators';
import { CrateEvent } from '../shared/model/crate-event.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../shared/model/pageable.model';
import * as ActivityActions from '../shared/store/actions/activity.actions';
import * as NavigationActions from '../shared/store/actions/navigation.actions';
import {
  selectActivityFeed,
  selectFeedLoading,
  selectFeedLoaded,
  selectLoadingMore,
  selectCanLoadMore,
  selectRefreshing,
  selectHasNewActivity,
  selectActivityError
} from '../shared/store/selectors/activity.selectors';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private destroy$ = new Subject<boolean>();
  
  feed$: Observable<CrateEvent[]>;
  loading$: Observable<boolean>;
  loadingMore$: Observable<boolean>;
  canLoadMore$: Observable<boolean>;
  refreshing$: Observable<boolean>;
  hasNewActivity$: Observable<boolean>;
  error$: Observable<any>;
  
  constructor(private store: Store) {
    this.feed$ = this.store.select(selectActivityFeed);
    this.loading$ = this.store.select(selectFeedLoading);
    this.loadingMore$ = this.store.select(selectLoadingMore);
    this.canLoadMore$ = this.store.select(selectCanLoadMore);
    this.refreshing$ = this.store.select(selectRefreshing);
    this.hasNewActivity$ = this.store.select(selectHasNewActivity);
    this.error$ = this.store.select(selectActivityError);
  }

  ngOnInit() {
    // Set navigation context to 'activity'
    this.store.dispatch(NavigationActions.setNavigationContext({ context: 'activity' }));

    // Load initial feed
    this.loadInitialFeed();

    // Setup infinite scroll
    this.setupInfiniteScroll();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadInitialFeed(): void {
    const pageable = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.dispatch(ActivityActions.loadActivityFeed({ pageable }));
  }

  private setupInfiniteScroll(): void {
    // Wait for the view to initialize
    setTimeout(() => {
      if (this.scrollContainer) {
        fromEvent(this.scrollContainer.nativeElement, 'scroll')
          .pipe(
            throttleTime(200),
            takeUntil(this.destroy$),
            map(() => this.scrollContainer.nativeElement),
            filter((element) => {
              const threshold = 200; // Load more when 200px from bottom
              return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
            })
          )
          .subscribe(() => {
            this.loadMore();
          });
      }
    });
  }

  private loadMore(): void {
    this.canLoadMore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(canLoad => {
      if (canLoad) {
        this.feed$.pipe(
          takeUntil(this.destroy$)
        ).subscribe(feed => {
          if (feed && feed.length > 0) {
            const lastItem = feed[feed.length - 1];
            this.store.dispatch(ActivityActions.loadMoreActivity({ 
              timestamp: new Date(lastItem.createdAt) 
            }));
          }
        });
      }
    });
  }

  onRefresh(): void {
    this.store.dispatch(ActivityActions.refreshActivityFeed());
  }

  trackByActivityId(index: number, activity: CrateEvent): number {
    return activity.id;
  }
}