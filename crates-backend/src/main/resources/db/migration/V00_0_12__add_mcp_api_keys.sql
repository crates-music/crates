-- Add MCP API key storage with encryption
CREATE TABLE mcp_api_key (
    id BIGSERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    scope VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Unique index on encrypted API key for fast lookups and uniqueness
CREATE UNIQUE INDEX idx_mcp_api_key_unique ON mcp_api_key(api_key);

-- Index on user_id for user-specific queries
CREATE INDEX idx_mcp_api_key_user_id ON mcp_api_key(user_id);

-- Index on expires_at for cleanup operations
CREATE INDEX idx_mcp_api_key_expires_at ON mcp_api_key(expires_at);

-- Composite index for finding active keys for a user
CREATE INDEX idx_mcp_api_key_user_active ON mcp_api_key(user_id, expires_at);

-- Add comment to document the encryption
COMMENT ON COLUMN mcp_api_key.api_key IS 'Encrypted API key using EncryptionConverter. Stored encrypted but queryable for authentication.';