-- Backfill historical activity events from existing data
-- This migration creates activity events for actions that happened before the activity system was implemented

-- 1. Backfill USER_FOLLOWED events from existing user_follow relationships
INSERT INTO crate_event (user_id, followed_user_id, event_type, created_at)
SELECT 
    uf.follower_id as user_id,
    uf.following_id as followed_user_id,
    'USER_FOLLOWED' as event_type,
    uf.created_at
FROM user_follow uf
LEFT JOIN crate_event ce ON (
    ce.user_id = uf.follower_id 
    AND ce.followed_user_id = uf.following_id 
    AND ce.event_type = 'USER_FOLLOWED'
)
WHERE ce.id IS NULL;

-- 2. Backfill CRATE_ADDED_TO_COLLECTION events from existing user_crate_collection relationships
INSERT INTO crate_event (user_id, crate_id, event_type, created_at)
SELECT 
    ucc.user_id,
    ucc.crate_id,
    'CRATE_ADDED_TO_COLLECTION' as event_type,
    ucc.created_at
FROM user_crate_collection ucc
LEFT JOIN crate_event ce ON (
    ce.user_id = ucc.user_id 
    AND ce.crate_id = ucc.crate_id 
    AND ce.event_type = 'CRATE_ADDED_TO_COLLECTION'
)
WHERE ce.id IS NULL;

-- 3. Backfill CRATE_RELEASED events for existing public crates
-- Using crate creation date as approximation since we don't track when they were made public
INSERT INTO crate_event (user_id, crate_id, event_type, created_at)
SELECT 
    c.user_id,
    c.id as crate_id,
    'CRATE_RELEASED' as event_type,
    c.created_at
FROM crate c
LEFT JOIN crate_event ce ON (
    ce.user_id = c.user_id 
    AND ce.crate_id = c.id 
    AND ce.event_type = 'CRATE_RELEASED'
)
WHERE c.public = true 
  AND ce.id IS NULL;

-- Add comment about what was backfilled
COMMENT ON TABLE crate_event IS 'Activity events for feed. Includes backfilled historical events from user_follow, user_crate_collection, and public crates.';