-- Add support for follow activity events

-- Add followed_user_id column to crate_event table for USER_FOLLOWED events
ALTER TABLE crate_event 
ADD COLUMN followed_user_id BIGINT NULL;

-- Add foreign key constraint for followed_user_id
ALTER TABLE crate_event
ADD CONSTRAINT fk_crate_event_followed_user 
FOREIGN KEY (followed_user_id) REFERENCES spotify_user (id) ON DELETE CASCADE;

-- Create index for efficient follow event queries
CREATE INDEX idx_crate_event_followed_user ON crate_event (followed_user_id);

-- Update comment to include new event type
COMMENT ON COLUMN crate_event.event_type IS 'Event types: CRATE_RELEASED, ALBUM_ADDED, CRATE_ADDED_TO_COLLECTION, USER_FOLLOWED';