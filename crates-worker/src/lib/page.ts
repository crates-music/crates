// Spring Data `Page<T>` JSON envelope — consumed by the Angular app and the
// public site's Alpine.js (which reads `content` and `last`).

export interface SpringPage<T> {
  content: T[];
  pageable: {
    sort: unknown[];
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
  sort: unknown[];
  numberOfElements: number;
  empty: boolean;
}

export function springPage<T>(content: T[], page: number, size: number, totalElements: number): SpringPage<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    pageable: {
      sort: [],
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
    sort: [],
    numberOfElements: content.length,
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
