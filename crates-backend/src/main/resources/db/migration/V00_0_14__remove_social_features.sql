-- Remove social features: following, crate collections, and event tracking

-- Drop indexes first
DROP INDEX IF EXISTS idx_crate_event_user;
DROP INDEX IF EXISTS idx_crate_event_created_at;
DROP INDEX IF EXISTS idx_crate_event_user_created_at;
DROP INDEX IF EXISTS idx_user_crate_collection_user;
DROP INDEX IF EXISTS idx_user_crate_collection_crate;
DROP INDEX IF EXISTS idx_user_follow_follower;
DROP INDEX IF EXISTS idx_user_follow_following;

-- Drop tables
DROP TABLE IF EXISTS crate_event;
DROP TABLE IF EXISTS user_crate_collection;
DROP TABLE IF EXISTS user_follow;

-- Remove follower_count column from crate table
ALTER TABLE crate DROP COLUMN IF EXISTS follower_count;
