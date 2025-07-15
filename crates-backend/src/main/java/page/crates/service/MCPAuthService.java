package page.crates.service;

import page.crates.mcp.MCPApiKey;

/**
 * Service for managing temporary API keys for ChatGPT integration
 */
public interface MCPAuthService {
    
    /**
     * Generate a temporary API key for a user after successful Spotify OAuth
     */
    String generateApiKey(String spotifyUserId, String scope);
    
    /**
     * Validate and retrieve user info from API key
     */
    MCPApiKey validateApiKey(String apiKey);
    
    /**
     * Revoke/expire an API key
     */
    void revokeApiKey(String apiKey);
    
    /**
     * Clean up expired API keys
     */
    void cleanupExpiredKeys();
}