-- Usage tracking. Before this, coming back to browse crates and play albums left no
-- trace: sessions never expire, reads write nothing, and plays are plain links to
-- open.spotify.com.

-- One row per user per UTC day per surface ('app' = authenticated API call,
-- 'mcp' = MCP web API call), written server-side. The backbone for DAU/WAU/MAU.
CREATE TABLE user_activity (
    user_id INTEGER NOT NULL REFERENCES spotify_user (id) ON DELETE CASCADE,
    day     TEXT NOT NULL,                  -- 'YYYY-MM-DD' (UTC)
    source  TEXT NOT NULL,
    PRIMARY KEY (user_id, day, source)
);
CREATE INDEX idx_user_activity_day ON user_activity (day);

-- Raw behavioral events sent by the app (app_open, page_view, album_play).
-- crate_id / album_id are not foreign keys: events outlive deleted crates.
CREATE TABLE event (
    id       INTEGER PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES spotify_user (id) ON DELETE CASCADE,
    type     TEXT NOT NULL,
    crate_id INTEGER,
    album_id INTEGER,
    props    TEXT,                          -- small JSON object, e.g. {"path":"/crate/12"}
    at       INTEGER NOT NULL               -- epoch ms, server clock
);
CREATE INDEX idx_event_at ON event (at);
CREATE INDEX idx_event_user_at ON event (user_id, at);
CREATE INDEX idx_event_type_at ON event (type, at);
