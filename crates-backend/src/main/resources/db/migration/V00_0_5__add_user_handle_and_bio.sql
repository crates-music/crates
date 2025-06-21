-- Add handle and bio fields to spotify_user table
ALTER TABLE spotify_user 
ADD COLUMN handle VARCHAR(64) NULL,
ADD COLUMN bio VARCHAR(280) NULL;

-- Create unique constraint on handle (nullable values don't conflict)
ALTER TABLE spotify_user 
ADD CONSTRAINT uk_spotify_user_handle UNIQUE (handle);

-- Update crate table to make handle unique per user instead of globally
-- First drop the existing unique constraint
ALTER TABLE crate DROP CONSTRAINT uk_crate_handle;

-- Add new composite unique constraint for handle per user
ALTER TABLE crate 
ADD CONSTRAINT uk_crate_user_handle UNIQUE (user_id, handle);