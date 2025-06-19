-- Initialize crates database and user
-- This runs during PostgreSQL initialization

-- Create the crates user
CREATE USER crates WITH PASSWORD 'cratesforfun';

-- Create the crates database
CREATE DATABASE crates OWNER crates;

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE crates TO crates;