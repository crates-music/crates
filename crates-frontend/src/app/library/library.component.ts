import { Component, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { LibraryService } from './shared/services/library.service';
import { Album } from './shared/model/album.model';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { DEFAULT_PAGE_SIZE, Pageable } from '../shared/model/pageable.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CrateSelectionModal } from '../crate/shared/modal/crate-selection/crate-selection.modal';
import { CrateService } from '../crate/shared/crate.service';
import { Store } from '@ngrx/store';
import { loadAlbums, reloadAlbums } from './store/actions/load-albums.actions';
import { LibraryAlbumFilter } from './shared/model/library-album-filter.enum';
import {
  selectAlbumPageable,
  selectAlbumsHasNextPage,
  selectAllAlbums,
  selectHideCrated,
  selectLibrary, selectLibraryListType,
  selectLibraryLoaded,
  selectLibraryLoading
} from './store/selectors/library.selectors';
import { clearAlbumSelection, toggleAlbumSelection } from './store/actions/album-selection.action';
import { loadLibrary, syncLibrary } from './store/actions/sync.actions';
import { addAlbumsToCrate } from '../crate/store/actions/crate-album.actions';
import { Library, LibraryState } from './shared/model/library.model';
import { hideCratedAlbums, showCratedAlbums, toggleListType } from './store/actions/library-option.actions';
import { ListType } from '../shared/model/list-type.model';

@Component({
  selector: 'crate-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit, OnDestroy, AfterViewInit {
  page: Pageable;
  albums: Album[] = [];
  albumsSelected = false;
  albums$: Observable<Album[]>;
  selectedAlbumCount = 0;
  hideCrated = true;
  destroy$ = new Subject<boolean>();
  hasNextPage$: Observable<boolean>;
  library$: Observable<Library>;
  libraryLoaded$: Observable<boolean>;
  libraryLoading$: Observable<boolean>;
  libraryListType: ListType;
  search: string;

  // Pull to refresh properties
  @ViewChild('libraryContainer', { static: false }) libraryContainer!: ElementRef;
  pullToRefreshThreshold = 100;
  isPulling = false;
  pullDistance = 0;
  startY = 0;

  LibraryState = LibraryState;
  ListType = ListType;

  constructor(private libraryService: LibraryService,
              private modal: NgbModal,
              private crateService: CrateService,
              private store: Store) {
    this.hasNextPage$ = this.store.select(selectAlbumsHasNextPage);
    this.library$ = this.store.select(selectLibrary);
    this.libraryLoaded$ = this.store.select(selectLibraryLoaded);
    this.libraryLoading$ = this.store.select(selectLibraryLoading);
    this.albums$ = this.store.select(selectAllAlbums);

    this.store.select(selectHideCrated)
      .pipe(
        tap(hideCrated => {
          this.hideCrated = hideCrated
        }),
        takeUntil(this.destroy$)
      ).subscribe();

    this.store.select(selectAllAlbums).pipe(
      tap(albums => (this.albums = albums)),
      takeUntil(this.destroy$)
    ).subscribe();

    this.store.select(selectLibraryListType).pipe(
      tap(listType => (this.libraryListType = listType)),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnInit(): void {
    this.loadAlbums();
  }

  ngAfterViewInit(): void {
    this.initPullToRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    
    // Clean up pull-to-refresh event listeners
    window.removeEventListener('touchstart', this.onTouchStart.bind(this));
    window.removeEventListener('touchmove', this.onTouchMove.bind(this));
    window.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  loadAlbums() {
    this.store.select(selectAlbumPageable)
      .pipe(
        tap(pageable => {
          this.page = pageable;
          this.store.dispatch(loadAlbums({
            pageable: this.page,
            filters: this.hideCrated ? [LibraryAlbumFilter.ExcludeCrated] : [],
          }));
          this.store.dispatch(loadLibrary());
        }),
        takeUntil(this.destroy$),
      ).subscribe();
  }

  reloadAlbums(search?: string) {
    this.page = Pageable.of(0, DEFAULT_PAGE_SIZE);
    if (this.hideCrated) {
      this.store.dispatch(hideCratedAlbums());
    } else {
      this.store.dispatch(showCratedAlbums());
    }
    this.store.dispatch(reloadAlbums({
      pageable: this.page,
      search,
      filters: [],
    }));
  }

  trackByAlbumId(index: number, album: Album): string {
    return String(album.id);
  }

  getArtistNames(album: Album) {
    return album.artists.map(artist => artist.name).join(', ');
  }

  loadMore() {
    this.page = this.page.nextPageable();
    this.store.dispatch(loadAlbums({
      pageable: this.page,
      filters: [LibraryAlbumFilter.ExcludeCrated],
    }));
  }

  toggledSelected(album: Album) {
    this.store.dispatch(toggleAlbumSelection({ album }));
    this.selectedAlbumCount = this.albums.filter(album => album.selected).length;
    this.albumsSelected = this.selectedAlbumCount > 0;
  }

  clearSelection() {
    this.store.dispatch(clearAlbumSelection());
    this.selectedAlbumCount = 0;
    this.albumsSelected = false;
  }

  syncLibrary() {
    this.store.dispatch(syncLibrary());
  }

  addAlbumsToCrate() {
    const modalRef = this.modal.open(CrateSelectionModal, {
      centered: true
    });
    modalRef.closed.pipe(
      tap(crate => {
        this.store.dispatch(addAlbumsToCrate({ crate, albums: this.albums.filter(album => album.selected) }));
        this.clearSelection();
      }),
    ).subscribe();
  }

  handleSearch($event: string) {
    this.reloadAlbums($event);
  }

  toggleLibraryListType(listType: ListType) {
    this.store.dispatch(toggleListType({ listType }));
  }

  // Pull to refresh methods
  initPullToRefresh() {
    // Attach to the whole window for better touch detection
    window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }

  onTouchStart(event: TouchEvent) {
    if (window.scrollY === 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = false;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (this.startY === 0 || !this.libraryContainer) return;

    const currentY = event.touches[0].clientY;
    const diffY = currentY - this.startY;

    // Only pull if at top and pulling down
    if (window.scrollY === 0 && diffY > 0) {
      event.preventDefault(); // Prevent default scroll behavior
      
      this.pullDistance = Math.min(diffY * 0.6, this.pullToRefreshThreshold * 1.5); // Damping effect
      this.isPulling = this.pullDistance > 20;
      
      // Apply transform to entire library container and pull indicator
      const libraryContainer = this.libraryContainer.nativeElement;
      const pullIndicator = libraryContainer.querySelector('.pull-refresh-indicator') as HTMLElement;
      
      if (libraryContainer && pullIndicator) {
        // Move the entire library container (header + content) down
        libraryContainer.style.transform = `translateY(${this.pullDistance}px)`;
        
        // Show/animate the pull indicator
        const progress = Math.min(this.pullDistance / this.pullToRefreshThreshold, 1);
        pullIndicator.style.transform = `translateY(${-100 + (progress * 100)}%)`;
        pullIndicator.style.opacity = progress.toString();
      }
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.isPulling && this.pullDistance >= this.pullToRefreshThreshold) {
      this.triggerRefresh();
    }
    
    this.resetPullToRefresh();
    this.startY = 0;
  }

  triggerRefresh() {
    this.syncLibrary();
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  resetPullToRefresh() {
    this.isPulling = false;
    this.pullDistance = 0;
    
    if (this.libraryContainer) {
      const libraryContainer = this.libraryContainer.nativeElement;
      const pullIndicator = libraryContainer.querySelector('.pull-refresh-indicator') as HTMLElement;
      
      if (libraryContainer && pullIndicator) {
        // Reset library container position
        libraryContainer.style.transform = 'translateY(0)';
        
        // Hide pull indicator
        pullIndicator.style.transform = 'translateY(-100%)';
        pullIndicator.style.opacity = '0';
      }
    }
  }
}
