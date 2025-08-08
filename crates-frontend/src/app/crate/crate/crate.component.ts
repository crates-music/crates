import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Crate } from '../shared/model/crate.model';
import { Album } from '../../library/shared/model/album.model';
import { DEFAULT_PAGE_SIZE, Pageable } from '../../shared/model/pageable.model';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadCrate } from '../store/actions/load-crates.actions';
import {
  selectAllCrateAlbums,
  selectCrate, selectCrateAlbumListType,
  selectCrateAlbumsHasNextPage,
  selectCrateAlbumsLoading,
  selectCratesListType
} from '../store/selectors/crate.selectors';
import { loadCrateAlbums, reloadCrateAlbums, toggleCrateAlbumListType } from '../store/actions/crate-album.actions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RemoveAlbumModalComponent } from '../shared/modal/remove-album/remove-album-modal.component';
import { ListType } from '../../shared/model/list-type.model';
import { PublicLinkService } from '../../shared/services/public-link.service';
import { selectUser } from '../../user/store/selectors/user.selectors';
import { User } from '../../user/shared/model/user.model';
import * as NavigationActions from '../../shared/store/actions/navigation.actions';
import { selectCurrentNavigationContext } from '../../shared/store/selectors/navigation.selectors';

@Component({
  selector: 'crates-crate',
  templateUrl: './crate.component.html',
  styleUrls: ['./crate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CrateComponent implements OnInit, OnDestroy {
  page: Pageable;
  crate: Crate;
  albums: Album[] = [];
  destroy$ = new Subject<boolean>();
  hasNextPage$: Observable<boolean>;
  loading$: Observable<boolean>;
  user: User;

  crateListType: ListType;
  search: string;
  


  constructor(private activatedRoute: ActivatedRoute,
              private store: Store,
              private modal: NgbModal,
              private router: Router,
              private publicLinkService: PublicLinkService) {
    this.loadCrate();
    this.page = Pageable.of(0, DEFAULT_PAGE_SIZE);
    this.store.select(selectCrate).pipe(
      tap(crate => {
        this.crate = crate;
        this.albums = [];
        if (!!crate) {
          this.store.dispatch(loadCrateAlbums({
            crate: this.crate,
            pageable: this.page,
          }));
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    this.store.select(selectAllCrateAlbums).pipe(
      tap(albums => {
        this.albums = albums.map(crateAlbum => crateAlbum.album);
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    this.hasNextPage$ = this.store.select(selectCrateAlbumsHasNextPage);
    this.loading$ = this.store.select(selectCrateAlbumsLoading);

    this.store.select(selectCrateAlbumListType).pipe(
      tap(listType => this.crateListType = listType),
      takeUntil(this.destroy$),
    ).subscribe();

    this.store.select(selectUser).pipe(
      tap(user => this.user = user),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnInit(): void {
    this.albums = [];
    
    // Determine navigation context based on crate ownership and navigation history
    this.store.select(selectCrate).pipe(
      takeUntil(this.destroy$)
    ).subscribe(crate => {
      if (crate && this.user) {
        const isOwnCrate = crate.user?.id === this.user.id;
        
        if (isOwnCrate) {
          // Own crate - set context to 'crates'
          this.store.dispatch(NavigationActions.setNavigationContext({ context: 'crates' }));
        } else {
          // Someone else's crate - keep current context or default to 'discover'
          this.store.select(selectCurrentNavigationContext).pipe(takeUntil(this.destroy$)).subscribe(currentContext => {
            if (!currentContext) {
              // No context set (direct navigation), default to 'discover'
              this.store.dispatch(NavigationActions.setNavigationContext({ context: 'discover' }));
            }
            // If context is already set (e.g., from discover), keep it
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadCrate(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    this.store.dispatch(loadCrate({ id }));
  }

  loadMore() {
    this.page = this.page.nextPageable();
    this.store.dispatch(loadCrateAlbums({ crate: this.crate, pageable: this.page }));
  }

  getArtistNames(album: Album) {
    return album.artists.map(artist => artist.name).join(', ');
  }

  getAlbumImageUrl(album: Album): string | null {
    return album.images && album.images.length > 0 ? album.images[0].url : null;
  }

  // https://open.spotify.com/album/2TklWyQdmNHg7d2Xmam8G8?si=660e00a203414f19
  openAlbum(album: Album) {
    window.location.href = `https://open.spotify.com/album/${album.spotifyId}`;
  }

  removeAlbum($event: MouseEvent, album: Album) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $event.stopImmediatePropagation();
    }
    const modalRef = this.modal.open(RemoveAlbumModalComponent, { centered: true });
    modalRef.componentInstance.crate = this.crate;
    modalRef.componentInstance.album = album;
  }

  handleSearch(search: string) {
    this.store.dispatch(reloadCrateAlbums({
      crate: this.crate,
      pageable: this.page,
      search,
    }));
  }

  toggleCrateListType(listType: ListType) {
    this.store.dispatch(toggleCrateAlbumListType({ listType }));
  }

  trackByAlbumId(index: number, album: Album): string {
    return String(album.id);
  }

  openSettings() {
    this.router.navigate(['/crate', this.crate.id, 'settings']);
  }

  shareCrate() {
    if (this.user && this.crate) {
      let url: string;
      
      if (this.isCurrentUserCrate()) {
        // User owns this crate - use authored URL
        url = this.publicLinkService.getCrateUrl(this.user, this.crate);
      } else {
        // User is viewing someone else's crate (it's in their collection) - use collection URL
        url = this.publicLinkService.getCollectionCrateUrl(this.user, this.crate);
      }
      
      this.publicLinkService.openInNewTab(url);
    }
  }

  shouldShowShareButton(): boolean {
    return this.crate?.publicCrate === true;
  }

  isCurrentUserCrate(): boolean {
    return this.user && this.crate && this.user.id === this.crate.user.id;
  }

  shouldShowCollectionButton(): boolean {
    return !this.isCurrentUserCrate() && this.crate?.publicCrate === true;
  }

  shouldShowAuthor(): boolean {
    return !this.isCurrentUserCrate() && !!this.crate?.user;
  }

  getAuthorName(): string {
    if (!this.crate?.user) return '';
    return this.crate.user.handle || this.crate.user.spotifyId;
  }

  getAuthorId(): number | undefined {
    return this.crate?.user?.id;
  }

  navigateToAuthor(authorId: number): void {
    this.router.navigate(['/user', authorId]);
  }

  protected readonly ListType = ListType;
}
