-- Add private profile support to users
ALTER TABLE spotify_user ADD COLUMN private_profile BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for efficient filtering of public profiles
CREATE INDEX idx_spotify_user_private_profile ON spotify_user(private_profile) WHERE private_profile = false;

-- Create index for user search on public profiles only
CREATE INDEX idx_spotify_user_public_search ON spotify_user(display_name, handle, spotify_id) WHERE private_profile = false;

-- Update the existing crate public index to also consider profile privacy
DROP INDEX IF EXISTS idx_crate_public_trending;
CREATE INDEX idx_crate_public_trending ON crate(public, trending_score DESC, follower_count DESC) 
WHERE public = true;

-- Create index for discovering crates from public profiles only
CREATE INDEX idx_crate_public_profile_trending ON crate(id) 
WHERE public = true;

-- Add comment to document the feature
COMMENT ON COLUMN spotify_user.private_profile IS 'When true, user profile is not discoverable in search, trending, or public listings. Individual crates remain private but follow relationships are preserved.';