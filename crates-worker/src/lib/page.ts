// Spring Data `Page<T>` JSON envelope — consumed by the Angular app and the
// public site's Alpine.js (which reads `content` and `last`).

/** Spring serializes `Sort` as an array of these. Empty when the request sent no sort. */
export interface SpringOrder {
  direction: 'ASC' | 'DESC';
  property: string;
  ignoreCase: boolean;
  nullHandling: string;
  ascending: boolean;
  descending: boolean;
}

export function springOrders(sort: { prop: string; desc: boolean } | null | undefined): SpringOrder[] {
  if (!sort) return [];
  return [
    {
      direction: sort.desc ? 'DESC' : 'ASC',
      property: sort.prop,
      ignoreCase: false,
      nullHandling: 'NATIVE',
      ascending: !sort.desc,
      descending: sort.desc,
    },
  ];
}

/**
 * CrateServiceImpl.getAlbums swaps the Pageable for an unsorted PageRequest when the
 * request asks for the artistName sort — the native GROUP BY queries do the ordering
 * themselves — so the Page it returns echoes no sort at all. Mirror that, or the
 * envelope diverges on exactly the sort the frontend uses most.
 */
export const echoedSort = (sort: { prop: string; desc: boolean } | null | undefined) =>
  sort?.prop === 'artistName' ? null : sort;

export interface SpringPage<T> {
  content: T[];
  pageable: {
    sort: SpringOrder[];
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: SpringOrder[];
  numberOfElements: number;
  empty: boolean;
}

export function springPage<T>(
  content: T[],
  page: number,
  size: number,
  totalElements: number,
  sort?: { prop: string; desc: boolean } | null,
): SpringPage<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  const orders = springOrders(sort);
  return {
    content,
    pageable: {
      sort: orders,
      pageNumber: page,
      pageSize: size,
      offset: page * size,
      paged: true,
      unpaged: false,
    },
    last: page >= totalPages - 1,
    totalPages,
    totalElements,
    first: page === 0,
    size,
    number: page,
    sort: orders,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

/**
 * The public site's own AJAX endpoints (`/api/:username/...`) return the narrower
 * envelope the Go service produced — it unmarshalled the backend's `Page` into its own
 * structs, dropping `pageable` and `sort`. Only the inline Alpine code reads these, and
 * it uses `content`/`last`, but keeping the shape exact means the parity harness stays
 * silent here instead of reporting a permanent superset.
 */
export function goPage<T>(content: T[], page: number, size: number, totalElements: number) {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    totalPages,
    totalElements,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
}

/** Spring-style pagination params: ?page=0&size=20&sort=prop,dir */
export function pageParams(
  query: Record<string, string | undefined>,
  defaults: { size?: number; maxSize?: number } = {},
): { page: number; size: number; sort: { prop: string; desc: boolean } | null } {
  const page = Math.max(0, parseInt(query.page ?? '0', 10) || 0);
  let size = parseInt(query.size ?? '', 10);
  if (!Number.isFinite(size) || size <= 0) size = defaults.size ?? 20;
  if (defaults.maxSize) size = Math.min(size, defaults.maxSize);
  const sortParam = query.sort;
  let sort: { prop: string; desc: boolean } | null = null;
  if (sortParam) {
    const [prop, dir] = sortParam.split(',');
    if (prop) sort = { prop, desc: (dir ?? '').toLowerCase() === 'desc' };
  }
  return { page, size, sort };
}
