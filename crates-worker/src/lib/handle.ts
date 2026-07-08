// Port of HandleServiceImpl.handelize — slugifies crate names and
// auto-generated user handles.

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const UNSAFE_CHARS = /[^a-zA-Z0-9\s-]/g;
const WHITESPACE = /\s+/g;
const MULTIPLE_HYPHENS = /-+/g;

export function handelize(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'untitled';
  const ascii = name.normalize('NFD').replace(COMBINING_MARKS, '');
  let result = ascii
    .replace(UNSAFE_CHARS, '')
    .replace(WHITESPACE, '-')
    .replace(MULTIPLE_HYPHENS, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  if (!result) return 'untitled';
  if (result.length > 50) result = result.slice(0, 50).replace(/-+$/g, '');
  return result;
}
