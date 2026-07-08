-- Crates D1 baseline schema.
-- Squashed translation of crates-backend Flyway V00_0_0..V00_0_17 (final state only),
-- per docs/cloudflare-migration/01-schema-and-data.md.
-- Conventions: INTEGER PRIMARY KEY (ids preserved from Postgres on import),
-- timestamps = epoch milliseconds (INTEGER), booleans = INTEGER 0/1,
-- images denormalized to a JSON TEXT column [{"id","url","width","height"}]
-- ordered width desc (id preserved from the legacy image table for DTO parity).

CREATE TABLE token (
    id            INTEGER PRIMARY KEY,
    auth_token    TEXT NOT NULL,             -- app session token (opaque, 256 chars)
    code          TEXT NOT NULL,
    access_token  TEXT NOT NULL,             -- AES-256-GCM: base64(iv[12] || ct || tag[16])
    refresh_token TEXT NOT NULL,             -- AES-256-GCM
    expiration    INTEGER NOT NULL
);
CREATE INDEX idx_token_auth_token ON token (auth_token);

CREATE TABLE spotify_user (
    id              INTEGER PRIMARY KEY,
    spotify_id      TEXT NOT NULL,
    country         TEXT,
    href            TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    email           TEXT,
    spotify_uri     TEXT NOT NULL,
    token_id        INTEGER REFERENCES token (id),
    handle          TEXT,                    -- 64 chars max, enforced at API layer
    bio             TEXT,                    -- 280 chars max, enforced at API layer
    private_profile INTEGER NOT NULL DEFAULT 0,
    email_opt_in    INTEGER NOT NULL DEFAULT 0,
    images          TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);
CREATE UNIQUE INDEX uk_spotify_user_spotify_id ON spotify_user (spotify_id);
CREATE UNIQUE INDEX uk_spotify_user_handle ON spotify_user (handle);
CREATE INDEX idx_spotify_user_public_search
    ON spotify_user (display_name, handle, spotify_id) WHERE private_profile = 0;

CREATE TABLE genre (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE UNIQUE INDEX uk_genre_name ON genre (name);

CREATE TABLE artist (
    id             INTEGER PRIMARY KEY,
    spotify_id     TEXT NOT NULL,
    spotify_uri    TEXT NOT NULL,
    name           TEXT NOT NULL,
    popularity     INTEGER NOT NULL DEFAULT 0,
    genres_fetched INTEGER NOT NULL DEFAULT 0,
    images         TEXT
);
CREATE UNIQUE INDEX uk_artist_spotify_id ON artist (spotify_id);
CREATE INDEX idx_artist_name ON artist (name);

CREATE TABLE album (
    id           INTEGER PRIMARY KEY,
    spotify_id   TEXT NOT NULL,
    upc          TEXT,
    href         TEXT NOT NULL,
    name         TEXT NOT NULL,
    popularity   INTEGER NOT NULL DEFAULT 0,
    release_date INTEGER NOT NULL,
    images       TEXT
);
CREATE UNIQUE INDEX uk_album_spotify_id ON album (spotify_id);
CREATE INDEX idx_album_upc ON album (upc);
CREATE INDEX idx_album_name ON album (name);

CREATE TABLE album_to_artist (
    album_id  INTEGER NOT NULL REFERENCES album (id),
    artist_id INTEGER NOT NULL REFERENCES artist (id),
    PRIMARY KEY (album_id, artist_id)
);
CREATE INDEX idx_album_to_artist_artist ON album_to_artist (artist_id);

CREATE TABLE artist_to_genre (
    artist_id INTEGER NOT NULL REFERENCES artist (id),
    genre_id  INTEGER NOT NULL REFERENCES genre (id),
    PRIMARY KEY (artist_id, genre_id)
);

CREATE TABLE album_to_genre (
    album_id INTEGER NOT NULL REFERENCES album (id),
    genre_id INTEGER NOT NULL REFERENCES genre (id),
    PRIMARY KEY (album_id, genre_id)
);

CREATE TABLE crate (
    id                   INTEGER PRIMARY KEY,
    name                 TEXT NOT NULL,
    handle               TEXT NOT NULL,
    user_id              INTEGER NOT NULL REFERENCES spotify_user (id),
    state                TEXT NOT NULL DEFAULT 'ACTIVE',
    public               INTEGER NOT NULL DEFAULT 1,
    description          TEXT,                -- 300 chars max, enforced at API layer
    trending_score       REAL NOT NULL DEFAULT 0,
    last_trending_update INTEGER,
    created_at           INTEGER,
    updated_at           INTEGER
);
CREATE UNIQUE INDEX uk_crate_user_handle ON crate (user_id, handle);
CREATE INDEX idx_crate_user_id ON crate (user_id);
CREATE INDEX idx_crate_public_trending
    ON crate (public, trending_score DESC, created_at DESC) WHERE public = 1;

CREATE TABLE crate_album (
    id         INTEGER PRIMARY KEY,
    crate_id   INTEGER NOT NULL REFERENCES crate (id),
    album_id   INTEGER NOT NULL REFERENCES album (id),
    created_at INTEGER
);
CREATE UNIQUE INDEX uk_crate_album ON crate_album (crate_id, album_id);
CREATE INDEX idx_crate_album_album ON crate_album (album_id);

CREATE TABLE library (
    id              INTEGER PRIMARY KEY,
    spotify_user_id INTEGER NOT NULL REFERENCES spotify_user (id),
    state           TEXT NOT NULL,
    created_at      INTEGER,
    updated_at      INTEGER
);
CREATE UNIQUE INDEX uk_library_spotify_user_id ON library (spotify_user_id);

CREATE TABLE library_album (
    id              INTEGER PRIMARY KEY,
    album_id        INTEGER NOT NULL REFERENCES album (id),
    spotify_user_id INTEGER NOT NULL REFERENCES spotify_user (id),
    state           TEXT NOT NULL,
    added_at        INTEGER NOT NULL,
    created_at      INTEGER,
    archived_at     INTEGER,
    crated          INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uk_library_album_user_album ON library_album (album_id, spotify_user_id);
CREATE INDEX idx_library_album_user_state ON library_album (spotify_user_id, state);

CREATE TABLE crate_view (
    id         INTEGER PRIMARY KEY,
    crate_id   INTEGER NOT NULL REFERENCES crate (id) ON DELETE CASCADE,
    viewer_id  INTEGER REFERENCES spotify_user (id) ON DELETE SET NULL,
    viewed_at  INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer   TEXT
);
CREATE INDEX idx_crate_view_crate_time ON crate_view (crate_id, viewed_at);
CREATE INDEX idx_crate_view_viewed_at ON crate_view (viewed_at);
-- Anonymous view dedup: one row per (crate, ip, hour). Was date_trunc('hour', ...) in
-- Postgres; epoch-ms integer division gives the same hour bucket. Insert with
-- INSERT OR IGNORE.
CREATE UNIQUE INDEX idx_crate_view_anon_dedup
    ON crate_view (crate_id, ip_address, (viewed_at / 3600000)) WHERE viewer_id IS NULL;

CREATE TABLE mcp_api_key (
    id           INTEGER PRIMARY KEY,
    api_key_hash TEXT NOT NULL,              -- SHA-256 hex of the plaintext key (was AES-ECB encrypted value)
    user_id      TEXT NOT NULL,              -- Spotify id (string, matches legacy schema)
    scope        TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER NOT NULL
);
CREATE UNIQUE INDEX uk_mcp_api_key_hash ON mcp_api_key (api_key_hash);
CREATE INDEX idx_mcp_api_key_user_active ON mcp_api_key (user_id, expires_at);
CREATE INDEX idx_mcp_api_key_expires_at ON mcp_api_key (expires_at);

CREATE TABLE feedback (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER REFERENCES spotify_user (id),
    message    TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
