package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import page.crates.ai.*;
import page.crates.mcp.MCPApiKey;
import page.crates.service.CrateActionService;
import page.crates.service.MCPAuthService;
import page.crates.repository.SpotifyUserRepository;
import page.crates.entity.SpotifyUser;
import page.crates.security.UserContextHolder;

import java.util.List;

/**
 * REST API controller for ChatGPT Custom GPT integration
 * Converts MCP tools to HTTP endpoints with Bearer token authentication
 */
@RestController
@RequestMapping("/mcp/web")
@Slf4j
public class MCPWebController {
    
    @Resource
    private CrateActionService crateActionService;
    @Resource
    private MCPAuthService mcpAuthService;
    @Resource
    private SpotifyUserRepository spotifyUserRepository;
    
    /**
     * Validate API key from Authorization header and set user context
     */
    private String validateAndGetUserId(String authHeader) {
        log.debug("MCP Web API: Validating auth header: {}", authHeader != null ? "Bearer ***" : "null");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("MCP Web API: Missing or invalid Authorization header: {}", authHeader);
            throw new SecurityException("Missing or invalid Authorization header");
        }
        
        String apiKey = authHeader.substring(7); // Remove "Bearer "
        log.debug("MCP Web API: Extracted API key: {}", apiKey.substring(0, Math.min(apiKey.length(), 12)) + "...");
        
        MCPApiKey mcpApiKey = mcpAuthService.validateApiKey(apiKey);
        
        if (mcpApiKey == null) {
            log.warn("MCP Web API: Invalid or expired API key: {}", apiKey.substring(0, Math.min(apiKey.length(), 12)) + "...");
            throw new SecurityException("Invalid or expired API key");
        }
        
        // Look up the SpotifyUser by their Spotify ID and set in context (following your existing pattern)
        SpotifyUser user = spotifyUserRepository.findOneBySpotifyId(mcpApiKey.getUserId())
                .orElseThrow(() -> new SecurityException("User not found for Spotify ID: " + mcpApiKey.getUserId()));
        
        UserContextHolder.setUserContext(user);
        
        log.info("MCP Web API: Successfully validated API key and set user context for: {}", mcpApiKey.getUserId());
        return mcpApiKey.getUserId();
    }
    
    /**
     * REST endpoint: Get user's recent library albums
     * GET /mcp/web/library?limit=100
     */
    @GetMapping("/library")
    public ResponseEntity<List<SimpleLibraryAlbum>> getUserLibrary(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "limit", defaultValue = "100") int limit) {
        
        try {
            validateAndGetUserId(authHeader); // This sets the user context
            log.info("REST API: Getting library (limit: {})", limit);
            
            List<SimpleLibraryAlbum> library = crateActionService.getUserLibrary(limit);
            return ResponseEntity.ok(library);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error getting user library", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Search Spotify albums
     * GET /mcp/web/search/albums?q=bon+iver+for+emma&limit=10
     */
    @GetMapping("/search/albums")
    public ResponseEntity<List<SpotifyAlbumResult>> searchSpotifyAlbums(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        
        try {
            validateAndGetUserId(authHeader); // Just validate auth, don't need user ID for search
            log.info("REST API: Searching Spotify for: '{}' (limit: {})", query, limit);
            
            List<SpotifyAlbumResult> results = crateActionService.searchSpotifyAlbums(query);
            
            // Limit results if needed
            if (results.size() > limit) {
                results = results.subList(0, limit);
            }
            
            return ResponseEntity.ok(results);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error searching Spotify albums", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Create new crate
     * POST /mcp/web/crates
     * Body: {"name": "Rainy Day Vibes", "description": "Perfect for...", "isPublic": true}
     */
    @PostMapping("/crates")
    public ResponseEntity<CrateResult> createCrate(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateCrateRequest request) {
        
        try {
            String userId = validateAndGetUserId(authHeader);
            log.info("REST API: Creating crate '{}' for user {}", request.getName(), userId);
            
            CrateResult result = crateActionService.createCrate(
                    request.getName(), 
                    request.getDescription(), 
                    request.isPublic()
            );
            
            return ResponseEntity.ok(result);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error creating crate", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Add album to crate
     * POST /mcp/web/crates/{crateId}/albums
     * Body: {"spotifyAlbumId": "4aawyAB9vmqN3uQ7FjRGTy"}
     */
    @PostMapping("/crates/{crateId}/albums")
    public ResponseEntity<AdditionResult> addAlbumToCrate(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String crateId,
            @RequestBody AddAlbumRequest request) {
        
        try {
            String userId = validateAndGetUserId(authHeader);
            log.info("REST API: Adding album {} to crate {} for user {}", 
                    request.getSpotifyAlbumId(), crateId, userId);
            
            AdditionResult result = crateActionService.addAlbumToCrate(crateId, request.getSpotifyAlbumId());
            return ResponseEntity.ok(result);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error adding album to crate", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Get public crate link
     * GET /mcp/web/crates/{crateId}/link
     */
    @GetMapping("/crates/{crateId}/link")
    public ResponseEntity<ShareResult> getPublicCrateLink(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String crateId) {
        
        try {
            String userId = validateAndGetUserId(authHeader);
            log.info("REST API: Getting public link for crate {} (user: {})", crateId, userId);
            
            ShareResult result = crateActionService.getPublicCrateLink(crateId);
            return ResponseEntity.ok(result);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error getting public crate link", e);
            return ResponseEntity.status(500).build();
        }
    }
}