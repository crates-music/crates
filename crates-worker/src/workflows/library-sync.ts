// Library sync as a durable Workflow — replaces the fire-and-forget
// `new Thread` in LibrarySyncServiceImpl. Same three passes:
//   1. removals: /me/albums/contains in 20-id batches, archive missing
//      (skipped on FIRST_SYNC)
//   2. import: /me/albums pages (50/page — Java used 25), upsert catalog +
//      library rows; artists created shallow (no per-artist Spotify call)
//   3. enrichment: batch GET /artists?ids= (50/call) for genres_fetched=0
//      (Java fetched artists one call each, inline during import)
// Each step is retried and resumable; failures mark the library
// IMPORT_FAILED / UPDATE_FAILED as before.

import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { Env } from '../env';
import { insertAlbumFromSpotify } from '../lib/catalog';
import { ARTIST_BATCH, enrichArtistGenres } from '../lib/genres';
import {
  spGetSavedAlbums,
  spLibraryContains,
  withUserToken,
  type UserTokenRow,
} from '../lib/spotify';

export interface LibrarySyncParams {
  userId: number;
  firstSync: boolean;
}

const STEP_CONFIG = {
  retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
  timeout: '10 minutes',
} as const;

const CONTAINS_BATCH = 20; // Spotify max for /me/albums/contains
const SAVED_PAGE_SIZE = 50; // Spotify max for /me/albums
const PAGES_PER_STEP = 10;
const REMOVALS_PER_STEP = 2000;
const ARTIST_BATCHES_PER_STEP = 20;

export class LibrarySyncWorkflow extends WorkflowEntrypoint<Env, LibrarySyncParams> {
  async run(event: WorkflowEvent<LibrarySyncParams>, step: WorkflowStep): Promise<void> {
    const { userId, firstSync } = event.payload;
    try {
      if (!firstSync) {
        let cursor = Number.MAX_SAFE_INTEGER;
        for (let chunk = 0; cursor >= 0; chunk++) {
          cursor = await step.do(`removals-${chunk}`, STEP_CONFIG, () => this.processRemovals(userId, cursor));
        }
      }
      for (let chunk = 0; ; chunk++) {
        const done = await step.do(`import-${chunk}`, STEP_CONFIG, () => this.importPages(userId, chunk));
        if (done) break;
      }
      for (let chunk = 0; ; chunk++) {
        const more = await step.do(`enrich-artists-${chunk}`, STEP_CONFIG, () => this.enrichArtists());
        if (!more) break;
      }
      await step.do('finalize', STEP_CONFIG, async () => {
        await this.setLibraryState(userId, firstSync ? 'IMPORTED' : 'UPDATED');
      });
    } catch (e) {
      await step.do('mark-failed', async () => {
        await this.setLibraryState(userId, firstSync ? 'IMPORT_FAILED' : 'UPDATE_FAILED');
      });
      throw e;
    }
  }

  private async userToken(userId: number): Promise<UserTokenRow> {
    const row = await this.env.DB.prepare(
      `SELECT t.id AS token_id, t.access_token, t.refresh_token
         FROM spotify_user u JOIN token t ON t.id = u.token_id
        WHERE u.id = ?`,
    )
      .bind(userId)
      .first<UserTokenRow>();
    if (!row) throw new Error(`no token for user ${userId}`);
    return row;
  }

  private async setLibraryState(userId: number, state: string): Promise<void> {
    await this.env.DB.prepare('UPDATE library SET state = ?, updated_at = ? WHERE spotify_user_id = ?')
      .bind(state, Date.now(), userId)
      .run();
  }

  /**
   * Check one slice of existing library albums against Spotify; archive the
   * ones no longer saved. Returns the next id cursor, or -1 when finished.
   */
  private async processRemovals(userId: number, cursor: number): Promise<number> {
    const rows = await this.env.DB.prepare(
      `SELECT la.id, a.spotify_id FROM library_album la JOIN album a ON a.id = la.album_id
        WHERE la.state = 'ACTIVE' AND la.spotify_user_id = ? AND la.id < ?
        ORDER BY la.id DESC LIMIT ?`,
    )
      .bind(userId, cursor, REMOVALS_PER_STEP)
      .all<{ id: number; spotify_id: string }>();
    const albums = rows.results ?? [];
    if (albums.length === 0) return -1;

    const tokenRow = await this.userToken(userId);
    const toArchive: number[] = [];
    await withUserToken(this.env, tokenRow, async (token) => {
      toArchive.length = 0; // reset if retried after a mid-run refresh
      for (let i = 0; i < albums.length; i += CONTAINS_BATCH) {
        const batch = albums.slice(i, i + CONTAINS_BATCH);
        const results = await spLibraryContains(token, batch.map((a) => a.spotify_id));
        results.forEach((present, j) => {
          if (!present) toArchive.push(batch[j].id);
        });
      }
    });
    if (toArchive.length > 0) {
      const now = Date.now();
      const ph = toArchive.map(() => '?').join(',');
      await this.env.DB.prepare(
        `UPDATE library_album SET state = 'ARCHIVED', archived_at = ? WHERE id IN (${ph})`,
      )
        .bind(now, ...toArchive)
        .run();
      console.log(JSON.stringify({ event: 'sync_removals', userId, archived: toArchive.length }));
    }
    return albums.length < REMOVALS_PER_STEP ? -1 : albums[albums.length - 1].id;
  }

  /** Import PAGES_PER_STEP pages of saved albums. Returns true when done. */
  private async importPages(userId: number, chunk: number): Promise<boolean> {
    const tokenRow = await this.userToken(userId);
    const now = Date.now();
    return withUserToken(this.env, tokenRow, async (token) => {
      for (let i = 0; i < PAGES_PER_STEP; i++) {
        const offset = (chunk * PAGES_PER_STEP + i) * SAVED_PAGE_SIZE;
        const page = await spGetSavedAlbums(token, offset, SAVED_PAGE_SIZE);
        for (const saved of page.items) {
          const album = await insertAlbumFromSpotify(this.env, saved.album, { shallowArtists: true });
          // Java only refreshed added_at on existing rows; we also reactivate
          // previously-archived albums the user re-saved (legacy bug fix).
          await this.env.DB.prepare(
            `INSERT INTO library_album (album_id, spotify_user_id, state, added_at, created_at, crated)
             VALUES (?, ?, 'ACTIVE', ?, ?, 0)
             ON CONFLICT (album_id, spotify_user_id)
             DO UPDATE SET added_at = excluded.added_at, state = 'ACTIVE', archived_at = NULL`,
          )
            .bind(album.id, userId, Date.parse(saved.added_at), now)
            .run();
        }
        if (chunk === 0 && i === 0) {
          // Frontend shows partial results as soon as the first page lands.
          await this.setLibraryState(userId, 'IMPORTING_AFTER_FIRST_PAGE');
        }
        if (offset + page.items.length >= page.total || page.items.length < SAVED_PAGE_SIZE) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Backfill genres/images for artists created shallow, 50 per Spotify call.
   * Returns true if there may be more to enrich.
   */
  private async enrichArtists(): Promise<boolean> {
    for (let batch = 0; batch < ARTIST_BATCHES_PER_STEP; batch++) {
      const processed = await enrichArtistGenres(this.env, { limit: ARTIST_BATCH });
      if (processed === 0) return false;
    }
    return true;
  }
}
