-- Add email opt-in field to spotify_user table
ALTER TABLE spotify_user ADD COLUMN email_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment to document the field purpose
COMMENT ON COLUMN spotify_user.email_opt_in IS 'Whether the user has opted in to receive marketing emails and feature updates';