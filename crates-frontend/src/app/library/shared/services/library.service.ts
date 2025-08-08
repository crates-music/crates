import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pageable } from '../../../shared/model/pageable.model';
import { Album } from '../model/album.model';
import { Page } from '../../../shared/model/page.model';
import { first, map, mergeMap, Observable, tap, timeout, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LibraryAlbumFilter } from '../model/library-album-filter.enum';
import { Library, LibraryState } from '../model/library.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {

  constructor(private http: HttpClient) {
  }

  getAlbums(pageable: Pageable, search?: string, filters?: LibraryAlbumFilter[]): Observable<Page<Album>> {
    let params: any = {
      page: pageable.pageNumber,
      size: pageable.pageSize,
    };
    if (filters) {
      params = {
        ...params,
        filters: filters.join(',')
      }
    }
    if (search) {
      params = {
        ...params,
        search,
      }
    }
    
    // Use hybrid search endpoint when searching, otherwise use regular library endpoint
    const endpoint = search 
      ? `${environment.baseUri}/v1/library/albums/search`
      : `${environment.baseUri}/v1/library/albums`;
      
    return this.http.get(endpoint, {
      params,
    }).pipe(
      map(response => Object.assign(new Page<Album>(), response) as Page<Album>),
      map(page => {
        page.content = page.content.map(album => ({
          ...album,
          images: [...(album.images || [])].sort((a, b) => b.width - a.width)
        }));
        return page;
      })
    );
  }

  getLibrary(): Observable<Library> {
    return this.http.get(`${environment.baseUri}/v1/library`).pipe(
      map(response => Object.assign(new Library(), response) as Library)
    );
  }

  synchronize(): Observable<Library> {
    const sync$ = this.http.post(`${environment.baseUri}/v1/library/sync`, undefined);
    return sync$.pipe(mergeMap(() => this.pollLibrary()));
  }

  private pollLibrary(): Observable<Library> {
    const load$ = this.getLibrary();
    return timer(0, 1000).pipe(
      mergeMap(() => load$),
      first(library =>
        library.state === LibraryState.Updated ||
        library.state === LibraryState.ImportingAfterFirstPage ||
        library.state === LibraryState.UpdateFailed),
      tap(library => {
        if (library.state === LibraryState.UpdateFailed) {
          throw new Error('Library Update Failed');
        }
      }),
      timeout(120000)
    )
  }
}
