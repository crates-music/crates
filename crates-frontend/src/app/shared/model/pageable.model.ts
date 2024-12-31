import { Sort } from './sort.model';

export const DEFAULT_PAGE_SIZE = 50;

export class Pageable {
  sort: Sort;
  offset: number;
  pageSize: number;
  pageNumber: number;
  paged: boolean;
  unpaged: boolean;

  static of(page: number, size: number): Pageable {
    return Object.assign(new Pageable(), {
      offset: 0,
      pageNumber: page,
      pageSize: size,
      sort: Sort.empty(),
      paged: true,
      unpaged: false
    });
  }

  nextPageable(): Pageable {
    return Object.assign(new Pageable(), {
      offset: 0,
      pageNumber: this.pageNumber + 1,
      pageSize: this.pageSize,
      sort: this.sort,
      paged: true,
      unpaged: false
    });
  }

  previousPageable(): Pageable {
    return Object.assign(new Pageable(), {
      offset: 0,
      pageNumber: this.pageNumber - 1,
      pageSize: this.pageSize,
      sort: this.sort,
      paged: true,
      unpaged: false
    });
  }
}
