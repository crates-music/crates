package page.crates.service;

import page.crates.ai.*;

import java.util.List;

/**
 * Service for executing crate-related actions via MCP tools.
 * The AI makes the creative decisions, this service executes them.
 */
public interface CrateActionService {
    
    /**
     * Get user's recent library albums for AI to analyze taste
     */
    List<SimpleLibraryAlbum> getUserLibrary(String userId, int limit);
    
    /**
     * Search Spotify for albums by query
     */
    List<SpotifyAlbumResult> searchSpotifyAlbums(String searchQuery);
    
    /**
     * Create a new crate
     */
    CrateResult createCrate(String name, String description, boolean isPublic);
    
    /**
     * Add specific album to crate by Spotify ID
     */
    AdditionResult addAlbumToCrate(String crateId, String spotifyAlbumId);
    
    /**
     * Generate public sharing link for crate
     */
    ShareResult getPublicCrateLink(String crateId);
}