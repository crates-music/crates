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
 * Consolidated REST API controller for ChatGPT Custom GPT integration
 * Provides consolidated endpoints that reduce API calls by doing bulk operations
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
        
        // Look up the SpotifyUser by their Spotify ID and set in context
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
            validateAndGetUserId(authHeader);
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
     * REST endpoint: List user's crates
     * GET /mcp/web/crates?search=jazz
     */
    @GetMapping("/crates")
    public ResponseEntity<List<CrateListItem>> getUserCrates(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "search", required = false) String search) {
        
        try {
            validateAndGetUserId(authHeader);
            log.info("REST API: Getting user crates (search: '{}')", search);
            
            List<CrateListItem> crates = crateActionService.getUserCrates(search);
            return ResponseEntity.ok(crates);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error getting user crates", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Create crate with albums in one operation
     * POST /mcp/web/crates
     * Body: {"name": "Rainy Day Vibes", "description": "Perfect for...", "isPublic": true, "albums": [{"title": "For Emma", "artist": "Bon Iver"}]}
     */
    @PostMapping("/crates")
    public ResponseEntity<CrateSummary> createCrateWithAlbums(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateCrateWithAlbumsRequest request) {
        
        try {
            validateAndGetUserId(authHeader);
            log.info("REST API: Creating crate '{}' with {} albums", 
                    request.getName(), 
                    request.getAlbums() != null ? request.getAlbums().size() : 0);
            
            CrateSummary result = crateActionService.createCrateWithAlbums(request);
            return ResponseEntity.ok(result);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error creating crate with albums", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * REST endpoint: Add albums to existing crate (additive)
     * PUT /mcp/web/crates/{crateId}/albums
     * Body: {"albums": [{"title": "For Emma", "artist": "Bon Iver"}, {"title": "22, A Million", "artist": "Bon Iver"}]}
     */
    @PutMapping("/crates/{crateId}/albums")
    public ResponseEntity<CrateSummary> addAlbumsToCrate(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String crateId,
            @RequestBody AddAlbumsRequest request) {
        
        try {
            validateAndGetUserId(authHeader);
            log.info("REST API: Adding {} albums to crate {}", 
                    request.getAlbums() != null ? request.getAlbums().size() : 0, crateId);
            
            CrateSummary result = crateActionService.addAlbumsToCrate(crateId, request);
            return ResponseEntity.ok(result);
            
        } catch (SecurityException e) {
            log.warn("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Error adding albums to crate", e);
            return ResponseEntity.status(500).build();
        }
    }
    
}