-- Add social features: following, crate collections, and event tracking

-- Add follower_count to crate table
ALTER TABLE crate 
ADD COLUMN follower_count BIGINT NOT NULL DEFAULT 0;

-- Create user_follow table for user-to-user following relationships
CREATE TABLE IF NOT EXISTS user_follow
(
    id           SERIAL,
    follower_id  BIGINT    NOT NULL,
    following_id BIGINT    NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_follow UNIQUE (follower_id, following_id),
    CONSTRAINT fk_user_follow_follower FOREIGN KEY (follower_id) REFERENCES spotify_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follow_following FOREIGN KEY (following_id) REFERENCES spotify_user (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_follow_no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for efficient follow queries
CREATE INDEX idx_user_follow_follower ON user_follow (follower_id);
CREATE INDEX idx_user_follow_following ON user_follow (following_id);

-- Create user_crate_collection table for crates added to user collections
CREATE TABLE IF NOT EXISTS user_crate_collection
(
    id         SERIAL,
    user_id    BIGINT    NOT NULL,
    crate_id   BIGINT    NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_crate_collection UNIQUE (user_id, crate_id),
    CONSTRAINT fk_user_crate_collection_user FOREIGN KEY (user_id) REFERENCES spotify_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_crate_collection_crate FOREIGN KEY (crate_id) REFERENCES crate (id) ON DELETE CASCADE
);

-- Create indexes for efficient collection queries
CREATE INDEX idx_user_crate_collection_user ON user_crate_collection (user_id);
CREATE INDEX idx_user_crate_collection_crate ON user_crate_collection (crate_id);

-- Create crate_event table for feed event tracking
CREATE TABLE IF NOT EXISTS crate_event
(
    id          SERIAL,
    user_id     BIGINT       NOT NULL,
    crate_id    BIGINT       NULL,
    event_type  VARCHAR(50)  NOT NULL,
    album_ids   TEXT         NULL, -- JSON array of album IDs for bulk operations
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_crate_event_user FOREIGN KEY (user_id) REFERENCES spotify_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_crate_event_crate FOREIGN KEY (crate_id) REFERENCES crate (id) ON DELETE CASCADE
);

-- Create indexes for efficient feed queries
CREATE INDEX idx_crate_event_user ON crate_event (user_id);
CREATE INDEX idx_crate_event_created_at ON crate_event (created_at DESC);
CREATE INDEX idx_crate_event_user_created_at ON crate_event (user_id, created_at DESC);

-- Add comment to document event types
COMMENT ON COLUMN crate_event.event_type IS 'Event types: CRATE_RELEASED, ALBUM_ADDED, CRATE_ADDED_TO_COLLECTION';