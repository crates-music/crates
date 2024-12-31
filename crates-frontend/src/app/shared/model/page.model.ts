import { Pageable } from './pageable.model';
import { Sort } from './sort.model';

export class Page<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
  sort: Sort;
  size: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
