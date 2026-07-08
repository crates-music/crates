// Auth middleware — port of SpotifyAuthorizationAspect. Reads the opaque
// x-crates-auth-token header, resolves the user (+ encrypted Spotify token),
// and attaches it to the request context (replacing the ThreadLocal).

import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../env';
import type { UserRow } from './dto';
import type { UserTokenRow } from './spotify';

export interface AuthedUser extends UserRow, UserTokenRow {}

export type AuthVars = { Variables: { user: AuthedUser }; Bindings: Env };

export async function findUserByAuthToken(db: D1Database, authToken: string): Promise<AuthedUser | null> {
  return db
    .prepare(
      `SELECT u.*, t.id AS token_id, t.access_token, t.refresh_token
         FROM token t JOIN spotify_user u ON u.token_id = t.id
        WHERE t.auth_token = ?`,
    )
    .bind(authToken)
    .first<AuthedUser>();
}

export const requireAuth: MiddlewareHandler<AuthVars> = async (c, next) => {
  const token = c.req.header('x-crates-auth-token');
  if (!token || !token.trim()) return c.json({ error: 'unauthorized' }, 401);
  const user = await findUserByAuthToken(c.env.DB, token);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', user);
  await next();
};

export const currentUser = (c: Context<AuthVars>): AuthedUser => c.get('user');
