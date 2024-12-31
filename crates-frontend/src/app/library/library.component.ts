import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class LibraryComponent implements OnInit, OnDestroy {
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
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
}
