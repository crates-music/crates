-- Increase name column lengths to handle long Spotify album/artist names
ALTER TABLE album ALTER COLUMN name TYPE VARCHAR(512);
ALTER TABLE artist ALTER COLUMN name TYPE VARCHAR(512);
ALTER TABLE crate ALTER COLUMN name TYPE VARCHAR(256);
ALTER TABLE genre ALTER COLUMN name TYPE VARCHAR(256);
