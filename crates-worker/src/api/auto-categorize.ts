// Port of AutoCategorizeController + AutoCategorizeServiceImpl, plus the slice of
// CrateActionServiceImpl.createCrateWithAlbums that auto-categorize actually reaches.
//
// The album-matching half of CrateActionServiceImpl is not ported: auto-categorize
// always supplies albumId (the albums come from the user's own library), so the
// Spotify search-and-match path is unreachable from here.

import { Hono } from 'hono';
import type { Env } from '../env';
import { currentUser, requireAuth, type AuthVars } from '../lib/auth';
import { analyzeLibrary, type CatalogAlbum, type CrateProposal, type Strategy } from '../lib/categorization';
import { albumIdsInAnyCrate, libraryCatalogAlbums } from '../lib/categorization-queries';
import { enrichArtistGenres } from '../lib/genres';
import { handelize } from '../lib/handle';

export const autoCategorizeRoutes = new Hono<AuthVars>();
autoCategorizeRoutes.use('*', requireAuth);

interface SimpleAlbumReference {
  title: string;
  artist: string;
  albumId: number | null;
  artworkUrl: string | null;
}

interface CrateProposalPayload {
  name: string;
  albumCount: number;
  description: string | null;
  strategy: string;
  albums: SimpleAlbumReference[];
}

interface AlbumMatchResult {
  requestedTitle: string;
  requestedArtist: string;
  matched: boolean;
  actualTitle: string | null;
  actualArtist: string | null;
  message: string;
  matchedAlbum: null;
}

/**
 * AlbumMatchResult plus the album id it came from. The id is internal — Java counted
 * distinct AlbumMatchResult records instead, which silently merged two different albums
 * sharing a title and artist. It is stripped before the response goes out.
 */
type TrackedMatch = AlbumMatchResult & { albumId: number | null };

interface CrateSummary {
  crateId: string;
  crateName: string;
  description: string | null;
  handle: string;
  isPublic: boolean;
  totalAlbums: number;
  albumsAdded: number;
  albumsFailed: number;
  matchResults: TrackedMatch[];
  userMessage: string;
  publicUrl: string | null;
}

const STRATEGIES: Strategy[] = ['DECADE', 'GENRE', 'TOP_ARTIST', 'SMART_MIX'];

/** AutoCategorizeServiceImpl.getSmallestImageUrl — smallest width wins, nulls last. */
function smallestImageUrl(album: CatalogAlbum): string | null {
  if (album.images.length === 0) return null;
  let best = album.images[0];
  for (const img of album.images) {
    const a = img.width ?? Number.MAX_SAFE_INTEGER;
    const b = best.width ?? Number.MAX_SAFE_INTEGER;
    if (a < b) best = img;
  }
  return best.url ?? null;
}

const firstArtistName = (album: CatalogAlbum): string => album.artists[0]?.name ?? 'Unknown Artist';

const albumRef = (album: CatalogAlbum): SimpleAlbumReference => ({
  title: album.name,
  artist: firstArtistName(album),
  albumId: album.id,
  artworkUrl: smallestImageUrl(album),
});

const toProposalPayload = (p: CrateProposal): CrateProposalPayload => ({
  name: p.name,
  albumCount: p.albums.length,
  description: p.description,
  strategy: p.strategy,
  albums: p.albums.map(albumRef),
});

/**
 * Load the library, drop anything already in a crate, and top up artist genres.
 *
 * Java called GenreEnrichmentServiceImpl.bulkEnrichAlbums here, which fetched every
 * un-enriched artist from Spotify one call at a time and then reloaded them. This
 * batches at 50 per call and re-reads the affected albums once afterwards.
 */
async function loadLibrary(env: Env, userId: number) {
  const libraryAlbums = await libraryCatalogAlbums(env.DB, userId);
  const categorized = await albumIdsInAnyCrate(env.DB, userId, libraryAlbums.map((a) => a.id));
  let uncategorized = libraryAlbums.filter((a) => !categorized.has(a.id));

  let genreEnrichmentSuccessful = true;
  const artistIds = [...new Set(uncategorized.flatMap((a) => a.artists.map((ar) => ar.id)))];
  try {
    let enriched = 0;
    // Bounded so one call can't run away on a huge first-time library; whatever is
    // left gets picked up by the sync Workflow's own enrichment pass.
    while (enriched < 500) {
      const n = await enrichArtistGenres(env, { artistIds });
      if (n === 0) break;
      enriched += n;
    }
    if (enriched > 0) {
      const reloaded = await libraryCatalogAlbums(env.DB, userId);
      uncategorized = reloaded.filter((a) => !categorized.has(a.id));
    }
  } catch (e) {
    // Best effort, exactly as the Java treated it — categorize on what we already have.
    console.error('genre enrichment failed', String(e));
    genreEnrichmentSuccessful = false;
  }

  return { libraryAlbums, uncategorized, genreEnrichmentSuccessful };
}

// GET /v1/auto-categorize/preview
autoCategorizeRoutes.get('/preview', async (c) => {
  const user = currentUser(c);
  const { libraryAlbums, uncategorized } = await loadLibrary(c.env, user.id);
  const proposals = analyzeLibrary(uncategorized);

  const uniqueAlbums = new Set(proposals.flatMap((p) => p.albums.map((a) => a.id)));
  const coveragePercent = libraryAlbums.length > 0 ? (uniqueAlbums.size / libraryAlbums.length) * 100 : 0;

  return c.json({
    proposedCrates: proposals.length,
    albumsWillBeCategorized: uniqueAlbums.size,
    totalLibraryAlbums: libraryAlbums.length,
    coveragePercent,
    proposals: proposals.map(toProposalPayload),
    recommendation:
      `Ready to create ${proposals.length} curated crates from your library! ` +
      "We've analyzed your music taste across decades, genres, and artists to create the perfect organization.",
  });
});

/** Rebuild proposals from a preview payload, resolving album ids against the library. */
function proposalsFromPayload(payloads: CrateProposalPayload[], library: CatalogAlbum[]): CrateProposal[] {
  const byId = new Map(library.map((a) => [a.id, a]));
  return payloads.map((dto) => {
    const seen = new Set<number>();
    const albums: CatalogAlbum[] = [];
    for (const ref of dto.albums ?? []) {
      if (ref.albumId == null || seen.has(ref.albumId)) continue;
      const album = byId.get(ref.albumId);
      if (!album) continue; // album no longer in the library
      seen.add(ref.albumId);
      albums.push(album);
    }
    return {
      name: dto.name,
      albums,
      description: dto.description ?? null,
      strategy: STRATEGIES.includes(dto.strategy as Strategy) ? (dto.strategy as Strategy) : 'SMART_MIX',
      publicCrate: true,
      priority: 1.0,
    };
  });
}

// POST /v1/auto-categorize
autoCategorizeRoutes.post('/', async (c) => {
  const started = Date.now();
  const user = currentUser(c);

  let body: { proposals?: CrateProposalPayload[] } | null = null;
  try {
    body = await c.req.json();
  } catch {
    body = null; // @RequestBody(required = false)
  }

  const { libraryAlbums, uncategorized, genreEnrichmentSuccessful } = await loadLibrary(c.env, user.id);
  const proposals =
    body?.proposals && body.proposals.length > 0
      ? proposalsFromPayload(body.proposals, uncategorized)
      : analyzeLibrary(uncategorized);

  // Skip proposals whose crate already exists. Note the Java checks a handle derived as
  // name.toLowerCase().replace(" ", "-"), which is NOT how the crate handle is actually
  // built (handelize strips punctuation) — so a crate named "R&B/Soul" is looked up as
  // "r&b/soul" but stored as "rbsoul". Preserved so the same duplicates get skipped.
  const newProposals: CrateProposal[] = [];
  for (const p of proposals) {
    const lookupHandle = p.name.toLowerCase().replaceAll(' ', '-');
    const existing = await c.env.DB.prepare(
      `SELECT id FROM crate WHERE user_id = ? AND handle = ? AND state = 'ACTIVE'`,
    )
      .bind(user.id, lookupHandle)
      .first<{ id: number }>();
    if (!existing) newProposals.push(p);
  }

  const createdCrates: CrateSummary[] = [];
  for (const p of newProposals) {
    try {
      createdCrates.push(await createCrateWithAlbums(c.env, user, p));
    } catch (e) {
      // Java logs and moves to the next crate rather than failing the whole run.
      console.error(`failed to create crate ${p.name}`, String(e));
    }
  }

  const categorized = new Set<number>();
  for (const crate of createdCrates) {
    for (const m of crate.matchResults) if (m.matched && m.albumId != null) categorized.add(m.albumId);
  }
  const coveragePercent = libraryAlbums.length > 0 ? (categorized.size / libraryAlbums.length) * 100 : 0;

  return c.json({
    cratesCreated: createdCrates.length,
    albumsCategorized: categorized.size,
    coveragePercent,
    crates: createdCrates.map(({ matchResults, ...rest }) => ({
      ...rest,
      matchResults: matchResults.map(({ albumId, ...m }) => m),
    })),
    processingTimeMs: Date.now() - started,
    message:
      `Successfully created ${createdCrates.length} crates with ${categorized.size} albums! ` +
      'Your library is now beautifully organized and ready to explore.',
    genreEnrichmentSuccessful,
  });
});

/**
 * CrateActionServiceImpl.createCrateWithAlbums, albumId branch only: create the crate,
 * batch-insert its albums, mark them crated, and build the summary.
 */
async function createCrateWithAlbums(
  env: Env,
  user: { id: number; handle: string | null; spotify_id: string },
  proposal: CrateProposal,
): Promise<CrateSummary> {
  const now = Date.now();
  const handle = handelize(proposal.name);
  const row = await env.DB.prepare(
    `INSERT INTO crate (name, handle, user_id, state, public, description, trending_score, last_trending_update, created_at, updated_at)
     VALUES (?, ?, ?, 'ACTIVE', ?, ?, 0, ?, ?, ?) RETURNING id`,
  )
    .bind(proposal.name, handle, user.id, proposal.publicCrate ? 1 : 0, proposal.description, now, now, now)
    .first<{ id: number }>();
  const crateId = row!.id;

  const matchResults: TrackedMatch[] = proposal.albums.map((album) => ({
    requestedTitle: album.name,
    requestedArtist: firstArtistName(album),
    matched: true,
    actualTitle: album.name,
    actualArtist: firstArtistName(album),
    message: 'Using existing album from library',
    matchedAlbum: null,
    albumId: album.id,
  }));

  if (proposal.albums.length > 0) {
    const statements = proposal.albums.flatMap((album) => [
      env.DB.prepare('INSERT OR IGNORE INTO crate_album (crate_id, album_id, created_at) VALUES (?, ?, ?)').bind(
        crateId,
        album.id,
        now,
      ),
      // libraryAlbumService.markCrated
      env.DB.prepare('UPDATE library_album SET crated = 1 WHERE album_id = ? AND spotify_user_id = ?').bind(
        album.id,
        user.id,
      ),
    ]);
    await env.DB.batch(statements);
  }

  const albumsAdded = matchResults.filter((m) => m.matched).length;
  const albumsFailed = matchResults.length - albumsAdded;

  // generatePublicUrl: falls back to a handelized spotifyId when the user has no
  // handle. The Java notes it does not persist that generated handle; neither do we.
  const publicUrl = proposal.publicCrate
    ? `https://crates.music/${user.handle && user.handle.length > 0 ? user.handle : handelize(user.spotify_id)}/${handle}`
    : null;

  const userMessage =
    `Created '${proposal.name}' with ${albumsAdded} albums successfully added` +
    (albumsFailed > 0 ? ` (${albumsFailed} failed to match)` : '') +
    (publicUrl != null ? `. Share: ${publicUrl}` : '');

  return {
    crateId: String(crateId),
    crateName: proposal.name,
    description: proposal.description,
    handle,
    isPublic: proposal.publicCrate,
    totalAlbums: albumsAdded,
    albumsAdded,
    albumsFailed,
    matchResults,
    userMessage,
    publicUrl,
  };
}
