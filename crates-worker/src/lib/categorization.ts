// Port of page.crates.categorization — the "magic button" that proposes crates from a
// user's uncategorized library. Pure compute over albums already loaded from D1; no
// Spotify calls and no DB access happen in here.
//
// Java sources: LibraryAnalyzer, DecadeStrategy, GenreStrategy, TopArtistStrategy,
// SmartMixStrategy, CrateSelector.
//
// Two deliberate differences from the Java, both because the JVM behavior was itself
// unspecified:
//   - Java grouped into HashMaps, so proposal order (and therefore tie-breaking during
//     selection) depended on hash order. JS Maps iterate in insertion order, so the same
//     library always produces the same crates here.
//   - Decade labels used ZoneId.systemDefault(). Workers only have UTC, and release
//     dates are stored at midnight UTC, so this only differs for a server that was
//     running west of UTC — where it was arguably wrong already.

import type { ImageDto } from './dto';

export interface CatalogArtist {
  id: number;
  name: string;
  genres: string[];
}

export interface CatalogAlbum {
  id: number;
  name: string;
  popularity: number;
  /** epoch ms, or null when the album has no release date */
  releaseDate: number | null;
  images: ImageDto[];
  genres: string[];
  artists: CatalogArtist[];
}

export type Strategy = 'DECADE' | 'GENRE' | 'TOP_ARTIST' | 'SMART_MIX';

export interface CrateProposal {
  name: string;
  albums: CatalogAlbum[];
  strategy: Strategy;
  priority: number;
  description: string | null;
  publicCrate: boolean;
}

const MIN_ALBUMS_PER_CRATE = 8;
const IDEAL_ALBUMS_PER_CRATE = 10;

/** DecadeStrategy.CURRENT_YEAR — hardcoded in the Java, kept verbatim. */
const CURRENT_YEAR = 2025;

const proposal = (p: Omit<CrateProposal, 'description' | 'publicCrate'> & Partial<CrateProposal>): CrateProposal => ({
  description: null,
  publicCrate: true,
  ...p,
});

/** Java's putIfAbsent into a Map<Long, Album> — first album wins, order preserved. */
function addAlbum(bucket: Map<string, Map<number, CatalogAlbum>>, key: string, album: CatalogAlbum): void {
  let albums = bucket.get(key);
  if (!albums) {
    albums = new Map();
    bucket.set(key, albums);
  }
  if (!albums.has(album.id)) albums.set(album.id, album);
}

function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

const yearOf = (album: CatalogAlbum): number => new Date(album.releaseDate!).getUTCFullYear();

// ---------- DecadeStrategy ----------

function decadeLabel(album: CatalogAlbum): string {
  const year = yearOf(album);
  if (year < 1950) return 'Classic & Vintage';
  if (year >= CURRENT_YEAR) return `New Releases ${year}`;
  return `${Math.floor(year / 10) * 10}s`;
}

const BOOSTED_DECADES = new Set(['1980s', '1990s', '2000s']);

export function decadeStrategy(albums: CatalogAlbum[]): CrateProposal[] {
  const byDecade = new Map<string, CatalogAlbum[]>();
  for (const album of albums) {
    if (album.releaseDate == null) continue;
    const label = decadeLabel(album);
    const list = byDecade.get(label);
    if (list) list.push(album);
    else byDecade.set(label, [album]);
  }

  const proposals: CrateProposal[] = [];
  for (const [decade, decadeAlbums] of byDecade) {
    if (decadeAlbums.length < MIN_ALBUMS_PER_CRATE) continue;
    // calculatePriority reads the decade back off the first album, which is always
    // this same bucket — so the boost applies per decade, not per album.
    const boost = BOOSTED_DECADES.has(decade) ? 1.2 : 1.0;
    proposals.push(
      proposal({ name: decade, albums: decadeAlbums, strategy: 'DECADE', priority: decadeAlbums.length * boost }),
    );
  }
  return proposals;
}

// ---------- GenreStrategy ----------

const GENRE_HIERARCHY: Record<string, string> = {
  // Rock family
  'indie rock': 'Rock',
  'alternative rock': 'Rock',
  'classic rock': 'Rock',
  'hard rock': 'Rock',
  'punk rock': 'Rock',
  'progressive rock': 'Rock',
  'folk rock': 'Rock',
  'garage rock': 'Rock',
  'psychedelic rock': 'Rock',
  rock: 'Rock',
  // Hip Hop family
  'hip hop': 'Hip Hop',
  rap: 'Hip Hop',
  trap: 'Hip Hop',
  'east coast hip hop': 'Hip Hop',
  'west coast hip hop': 'Hip Hop',
  'conscious hip hop': 'Hip Hop',
  'underground hip hop': 'Hip Hop',
  // Electronic family
  electronic: 'Electronic',
  edm: 'Electronic',
  techno: 'Electronic',
  house: 'Electronic',
  'deep house': 'Electronic',
  electro: 'Electronic',
  ambient: 'Electronic',
  idm: 'Electronic',
  dubstep: 'Electronic',
  'drum and bass': 'Electronic',
  // Pop family
  pop: 'Pop',
  'indie pop': 'Pop',
  'synth-pop': 'Pop',
  electropop: 'Pop',
  'dream pop': 'Pop',
  'art pop': 'Pop',
  // R&B/Soul family
  'r&b': 'R&B/Soul',
  rnb: 'R&B/Soul',
  soul: 'R&B/Soul',
  'neo soul': 'R&B/Soul',
  funk: 'R&B/Soul',
  // Metal family
  metal: 'Metal',
  'heavy metal': 'Metal',
  'death metal': 'Metal',
  'black metal': 'Metal',
  'thrash metal': 'Metal',
  'doom metal': 'Metal',
  // Jazz family
  jazz: 'Jazz',
  bebop: 'Jazz',
  'cool jazz': 'Jazz',
  'free jazz': 'Jazz',
  'jazz fusion': 'Jazz',
  // Country family
  country: 'Country',
  'alt-country': 'Country',
  americana: 'Country',
  bluegrass: 'Country',
  // Classical family
  classical: 'Classical',
  baroque: 'Classical',
  romantic: 'Classical',
  'contemporary classical': 'Classical',
  // Reggae family
  reggae: 'Reggae',
  dub: 'Reggae',
  ska: 'Reggae',
};

/** Album genres, falling back to the artists' genres only when the album has none. */
function allGenresForAlbum(album: CatalogAlbum, transform: (g: string) => string | null): Set<string> {
  const out = new Set<string>();
  for (const g of album.genres) {
    const v = transform(g);
    if (v != null) out.add(v);
  }
  if (out.size === 0) {
    for (const artist of album.artists) {
      for (const g of artist.genres) {
        const v = transform(g);
        if (v != null) out.add(v);
      }
    }
  }
  return out;
}

const normalizeGenre = (genre: string): string | null => {
  const trimmed = genre?.trim();
  return trimmed ? genre.toLowerCase().trim() : null;
};

export function genreStrategy(albums: CatalogAlbum[]): CrateProposal[] {
  const genreToAlbums = new Map<string, Map<number, CatalogAlbum>>();
  for (const album of albums) {
    for (const genre of allGenresForAlbum(album, normalizeGenre)) {
      addAlbum(genreToAlbums, genre, album);
    }
  }

  // Consolidate to parent genres; unknown genres keep their own title-cased name.
  const consolidated = new Map<string, Map<number, CatalogAlbum>>();
  for (const [genre, albumsById] of genreToAlbums) {
    const parent = GENRE_HIERARCHY[genre] ?? toTitleCase(genre);
    let target = consolidated.get(parent);
    if (!target) {
      target = new Map();
      consolidated.set(parent, target);
    }
    for (const [id, album] of albumsById) if (!target.has(id)) target.set(id, album);
  }

  const proposals: CrateProposal[] = [];
  for (const [genre, albumsById] of consolidated) {
    const genreAlbums = [...albumsById.values()];
    if (genreAlbums.length < MIN_ALBUMS_PER_CRATE) continue;
    proposals.push(
      proposal({ name: genre, albums: genreAlbums, strategy: 'GENRE', priority: genreAlbums.length * 1.1 }),
    );
  }
  return proposals;
}

// ---------- TopArtistStrategy ----------

const MAX_ARTIST_CRATES = 3;

export function topArtistStrategy(albums: CatalogAlbum[]): CrateProposal[] {
  const byArtist = new Map<number, { artist: CatalogArtist; albums: Map<number, CatalogAlbum> }>();
  for (const album of albums) {
    for (const artist of album.artists) {
      let entry = byArtist.get(artist.id);
      if (!entry) {
        entry = { artist, albums: new Map() };
        byArtist.set(artist.id, entry);
      }
      if (!entry.albums.has(album.id)) entry.albums.set(album.id, album);
    }
  }

  return [...byArtist.values()]
    .filter((e) => e.albums.size >= MIN_ALBUMS_PER_CRATE)
    .sort((a, b) => b.albums.size - a.albums.size)
    .slice(0, MAX_ARTIST_CRATES)
    .map((e) => {
      const artistAlbums = [...e.albums.values()];
      return proposal({
        name: `Best of ${e.artist.name}`,
        albums: artistAlbums,
        strategy: 'TOP_ARTIST',
        priority: artistAlbums.length * 1.2,
      });
    });
}

// ---------- SmartMixStrategy ----------

/** SmartMixStrategy.consolidateGenre — a different, looser scheme than GENRE_HIERARCHY. */
function consolidateGenreLoose(genre: string): string {
  const lower = genre.toLowerCase();
  if (lower.includes('rock') && !lower.includes('hip hop')) return 'Rock';
  if (lower.includes('hip hop') || lower === 'rap' || lower === 'trap') return 'Hip Hop';
  if (
    lower.includes('electronic') ||
    lower.includes('techno') ||
    lower.includes('house') ||
    lower === 'edm' ||
    lower === 'dubstep' ||
    lower === 'ambient'
  ) {
    return 'Electronic';
  }
  if (lower.includes('pop') && !lower.includes('hip hop')) return 'Pop';
  if (lower.includes('r&b') || lower.includes('rnb') || lower.includes('soul') || lower.includes('funk')) {
    return 'R&B/Soul';
  }
  if (lower.includes('metal')) return 'Metal';
  if (lower.includes('jazz')) return 'Jazz';
  if (lower.includes('indie') && !lower.includes('rock')) return 'Indie';
  if (lower.includes('alternative')) return 'Alternative';
  return toTitleCase(genre);
}

export function smartMixStrategy(albums: CatalogAlbum[]): CrateProposal[] {
  // Java keyed this map on `decade + "_" + genre` and split the key back apart to build
  // the name. Keeping the pair avoids that round-trip; no genre contains an underscore,
  // so the names come out identical.
  const combos = new Map<string, { decade: string; genre: string; albums: Map<number, CatalogAlbum> }>();

  for (const album of albums) {
    if (album.releaseDate == null) continue;
    // Note: no Classic & Vintage / New Releases handling here — SmartMix always uses
    // the raw decade, as the Java did.
    const decade = `${Math.floor(yearOf(album) / 10) * 10}s`;
    for (const genre of allGenresForAlbum(album, consolidateGenreLoose)) {
      const key = `${decade}_${genre}`;
      let entry = combos.get(key);
      if (!entry) {
        entry = { decade, genre, albums: new Map() };
        combos.set(key, entry);
      }
      if (!entry.albums.has(album.id)) entry.albums.set(album.id, album);
    }
  }

  const proposals: CrateProposal[] = [];
  for (const { decade, genre, albums: albumsById } of combos.values()) {
    const mixAlbums = [...albumsById.values()];
    if (mixAlbums.length < MIN_ALBUMS_PER_CRATE) continue;
    proposals.push(
      proposal({
        name: `${decade} ${genre}`,
        albums: mixAlbums,
        strategy: 'SMART_MIX',
        priority: mixAlbums.length * 1.5,
      }),
    );
  }
  return proposals;
}

// ---------- CrateSelector ----------

const calculateMinCrates = (n: number) => (n < 100 ? 8 : n < 300 ? 12 : n < 600 ? 16 : n < 1000 ? 20 : 25);
const calculateMaxCrates = (n: number) => (n < 100 ? 12 : n < 300 ? 18 : n < 600 ? 25 : n < 1000 ? 30 : 40);
const calculateMaxAlbumsPerCrate = (n: number) => (n < 200 ? 12 : n < 500 ? 15 : n < 1000 ? 18 : 20);
const calculateMaxOverlapRatio = (n: number) => (n < 200 ? 0.3 : n < 500 ? 0.4 : n < 1000 ? 0.5 : 0.6);

/**
 * Drop albums already covered by a selected crate, and if too many remain keep the most
 * popular. Note the Java compares against maxAlbumsPerCrate but then truncates to
 * IDEAL_ALBUMS_PER_CRATE (10) — preserved, quirk and all.
 */
function trimAlbums(albums: CatalogAlbum[], covered: Set<number>, maxAlbumsPerCrate: number): CatalogAlbum[] {
  const uncovered = albums.filter((a) => !covered.has(a.id));
  if (uncovered.length > maxAlbumsPerCrate) {
    return [...uncovered].sort((a, b) => b.popularity - a.popularity).slice(0, IDEAL_ALBUMS_PER_CRATE);
  }
  return uncovered;
}

const sameProposal = (a: CrateProposal, b: CrateProposal): boolean =>
  a.name === b.name &&
  a.strategy === b.strategy &&
  a.priority === b.priority &&
  a.description === b.description &&
  a.publicCrate === b.publicCrate &&
  a.albums.length === b.albums.length &&
  a.albums.every((album, i) => album.id === b.albums[i].id);

export function selectOptimal(allProposals: CrateProposal[], totalLibrarySize: number): CrateProposal[] {
  const targetMinCrates = calculateMinCrates(totalLibrarySize);
  const targetMaxCrates = calculateMaxCrates(totalLibrarySize);
  const maxAlbumsPerCrate = calculateMaxAlbumsPerCrate(totalLibrarySize);
  const maxOverlapRatio = calculateMaxOverlapRatio(totalLibrarySize);

  // Very small library: relaxed pass that skips overlap and trimming entirely.
  if (totalLibrarySize < MIN_ALBUMS_PER_CRATE * 8) {
    return allProposals
      .filter((p) => p.albums.length >= 5)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  }

  // Highest-priority proposal wins each name; the resulting order drives the greedy pass.
  const unique = new Map<string, CrateProposal>();
  for (const p of [...allProposals].sort((a, b) => b.priority - a.priority)) {
    if (!unique.has(p.name)) unique.set(p.name, p);
  }
  const sortedProposals = [...unique.values()];

  const selected: CrateProposal[] = [];
  const covered = new Set<number>();

  for (const p of sortedProposals) {
    if (selected.length >= targetMaxCrates) break;

    const overlapCount = p.albums.filter((a) => covered.has(a.id)).length;
    if (overlapCount / p.albums.length > maxOverlapRatio) continue;

    const trimmed = trimAlbums(p.albums, covered, maxAlbumsPerCrate);
    if (trimmed.length < MIN_ALBUMS_PER_CRATE) continue;

    selected.push({ ...p, albums: trimmed });
    for (const a of trimmed) covered.add(a.id);
  }

  if (selected.length < targetMinCrates) {
    return relaxAndSelectMore(selected, sortedProposals, covered, targetMinCrates, maxOverlapRatio);
  }
  return selected;
}

function relaxAndSelectMore(
  currentSelected: CrateProposal[],
  allProposals: CrateProposal[],
  covered: Set<number>,
  targetMinCrates: number,
  baseMaxOverlap: number,
): CrateProposal[] {
  const relaxedSelected = [...currentSelected];
  const relaxedOverlap = Math.min(0.7, baseMaxOverlap * 1.5);

  for (const p of allProposals) {
    if (relaxedSelected.length >= targetMinCrates) break;
    // Java's List.contains on a @Data record: only skips a proposal that was selected
    // with its album list untouched, so trimmed ones can come back around.
    if (currentSelected.some((s) => sameProposal(s, p))) continue;

    const overlapCount = p.albums.filter((a) => covered.has(a.id)).length;
    if (overlapCount / p.albums.length > relaxedOverlap) continue;

    const trimmed = trimAlbums(p.albums, covered, calculateMaxAlbumsPerCrate(covered.size));
    if (trimmed.length >= MIN_ALBUMS_PER_CRATE / 2) {
      relaxedSelected.push({ ...p, albums: trimmed });
      for (const a of trimmed) covered.add(a.id);
    }
  }
  return relaxedSelected;
}

// ---------- LibraryAnalyzer ----------

export function analyzeLibrary(libraryAlbums: CatalogAlbum[]): CrateProposal[] {
  if (libraryAlbums.length === 0) return [];

  const all: CrateProposal[] = [];
  for (const [name, strategy] of [
    ['DecadeStrategy', decadeStrategy],
    ['GenreStrategy', genreStrategy],
    ['TopArtistStrategy', topArtistStrategy],
    ['SmartMixStrategy', smartMixStrategy],
  ] as const) {
    try {
      all.push(...strategy(libraryAlbums));
    } catch (e) {
      // One bad strategy shouldn't sink the request — the Java logs and continues.
      console.error(`categorization strategy ${name} failed`, String(e));
    }
  }

  if (all.length === 0) {
    throw new Error('Unable to categorize library - no valid crate proposals generated');
  }
  return selectOptimal(all, libraryAlbums.length);
}
