import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export type AnalyticsEventType = 'app_open' | 'page_view' | 'album_play';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  crateId?: number;
  albumId?: number;
  props?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH = 25;

/**
 * Usage events for POST /v1/events. Batched, and sent with fetch keepalive rather
 * than HttpClient so a flush survives the page being left (album_play navigates
 * straight to open.spotify.com). Best-effort: failures are dropped, never surfaced.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private queue: AnalyticsEvent[] = [];

  constructor(private authService: AuthService) {
    setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', () => this.flush());
  }

  track(event: AnalyticsEvent, opts: { immediate?: boolean } = {}): void {
    if (!this.authService.getToken()) return;
    this.queue.push(event);
    if (opts.immediate || this.queue.length >= MAX_BATCH) this.flush();
  }

  flush(): void {
    const token = this.authService.getToken();
    if (!token || this.queue.length === 0) return;
    const events = this.queue.splice(0, MAX_BATCH);
    fetch(`${environment.baseUri}/v1/events`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'x-crates-auth-token': token },
      body: JSON.stringify({ events }),
    }).catch(() => undefined);
  }
}
