import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pageable } from '../../shared/model/pageable.model';
import { Page } from '../../shared/model/page.model';
import { map, Observable } from 'rxjs';
import { Crate } from './model/crate.model';
import { environment } from '../../../environments/environment';
import { Album } from '../../library/shared/model/album.model';
import { CrateAlbum } from './model/crate-album.model';

@Injectable({
  providedIn: 'root'
})
export class CrateService {

  constructor(private http: HttpClient) {
  }

  getCrates(pageable: Pageable, search?: string): Observable<Page<Crate>> {
    let params: any = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'updatedAt,desc',
    }
    if (search) {
      params = {
        ...params,
        search,
      }
    }
    return this.http.get(`${environment.baseUri}/v1/crate`, {
      params,
    })
      .pipe(
        map(response => Object.assign(new Page<Crate>(), response)),
        map(cratePage => {
          cratePage.content = cratePage.content.map(crate => Object.assign(new Crate(), crate))
          return cratePage;
        })
      )
  }

  getCrate(id: number): Observable<Crate> {
    return this.http.get(`${environment.baseUri}/v1/crate/${id}`)
      .pipe(
        map(response => Object.assign(new Crate(), response)),
      )
  }

  createCrate(name: string): Observable<Crate> {
    return this.http.post(
      `${environment.baseUri}/v1/crate`, {
        name,
      } as Crate)
      .pipe(
        map(response => Object.assign(new Crate(), response)));
  }

  addAlbumsToCrate(crate: Crate, albums: Album[]): Observable<Crate> {
    return this.http.post(
      `${environment.baseUri}/v1/crate/${crate.id}/albums`, {
        albums,
      })
      .pipe(
        map(response => Object.assign(new Crate(), response)));
  }

  removeAlbumFromCrate(crate: Crate, album: Album): Observable<Crate> {
    return this.http.delete(
      `${environment.baseUri}/v1/crate/${crate.id}/album/${album.id}`)
      .pipe(
        map(response => Object.assign(new Crate(), response)));
  }

  getCrateAlbums(crate: Crate, pageable: Pageable, search?: string): Observable<Page<CrateAlbum>> {
    let params: any = {
      page: pageable.pageNumber.toString(),
      size: pageable.pageSize.toString(),
      sort: 'createdAt,desc',
    }
    if (search) {
      params = {
        ...params,
        search,
      }
    }
    return this.http.get(`${environment.baseUri}/v1/crate/${crate.id}/albums`, {
      params,
    })
      .pipe(
        map(response => Object.assign(new Page<CrateAlbum>(), response)),
        map(cratePage => {
          cratePage.content = cratePage.content
            .map(crateAlbum => Object.assign(new CrateAlbum(), crateAlbum))
            .map(crateAlbum => {
              const result: Album = Object.assign(new Album(), crateAlbum.album);
              result.images.sort((a, b) => b.width - a.width);
              crateAlbum.album = result;
              return crateAlbum;
            })
          return cratePage;
        })
      )
  }
}
