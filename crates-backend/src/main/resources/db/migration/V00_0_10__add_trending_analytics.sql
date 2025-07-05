-- Add trending analytics to crates table
ALTER TABLE crate ADD COLUMN trending_score DECIMAL(10,4) DEFAULT 0.0 NOT NULL;
ALTER TABLE crate ADD COLUMN last_trending_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Create crate_view table for view tracking
CREATE TABLE crate_view (
    id BIGSERIAL PRIMARY KEY,
    crate_id BIGINT NOT NULL,
    viewer_id BIGINT NULL, -- NULL for anonymous views
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- For anonymous view deduplication
    user_agent TEXT, -- For basic analytics
    referrer VARCHAR(500), -- Where the view came from
    
    CONSTRAINT fk_crate_view_crate FOREIGN KEY (crate_id) REFERENCES crate(id) ON DELETE CASCADE,
    CONSTRAINT fk_crate_view_viewer FOREIGN KEY (viewer_id) REFERENCES spotify_user(id) ON DELETE SET NULL
);

-- Create indexes for efficient trending queries
CREATE INDEX idx_crate_trending_score ON crate(trending_score DESC, follower_count DESC, created_at DESC);
CREATE INDEX idx_crate_public_trending ON crate(public, trending_score DESC, follower_count DESC) WHERE public = true;
CREATE INDEX idx_crate_last_trending_update ON crate(last_trending_update);

-- Create indexes for view tracking
CREATE INDEX idx_crate_view_crate_id ON crate_view(crate_id);
CREATE INDEX idx_crate_view_viewed_at ON crate_view(viewed_at);
CREATE INDEX idx_crate_view_crate_time ON crate_view(crate_id, viewed_at);
CREATE INDEX idx_crate_view_viewer_id ON crate_view(viewer_id) WHERE viewer_id IS NOT NULL;

-- Create unique constraint for anonymous view deduplication (same IP within 1 hour)
CREATE UNIQUE INDEX idx_crate_view_anonymous_dedup ON crate_view(crate_id, ip_address, date_trunc('hour', viewed_at)) WHERE viewer_id IS NULL;

-- Update existing crates to have initial trending update timestamp
UPDATE crate SET last_trending_update = updated_at WHERE last_trending_update IS NULL;