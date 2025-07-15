package page.crates.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import page.crates.mcp.MCPManifest;
import page.crates.mcp.MCPOAuth;
import page.crates.mcp.MCPParameter;
import page.crates.mcp.MCPServer;
import page.crates.mcp.MCPTool;

import java.util.List;
import java.util.Map;

/**
 * Controller that exposes the MCP manifest for ChatGPT Custom GPT and Claude Desktop discovery
 */
@RestController
@Slf4j
public class MCPManifestController {

    @Value("${crates.mcp.base-url:http://localhost:8980}")
    private String baseUrl;

    /**
     * MCP manifest endpoint for ChatGPT Custom GPT and Claude Desktop integration
     * This tells AI clients what tools are available and how to authenticate
     */
    @GetMapping("/.well-known/mcp")
    public ResponseEntity<MCPManifest> getMCPManifest() {
        log.info("Serving MCP manifest for ChatGPT and Claude Desktop integration");

        MCPManifest manifest = MCPManifest.builder()
                .name("crates")
                .version("1.0.0")
                .description("AI-powered music crate creation and management for Spotify libraries")
                .baseUrl(baseUrl)
                .servers(List.of(MCPServer.builder()
                        .url(baseUrl)
                        .build()))
                .transport("http")  // Use stateless HTTP transport instead of SSE
                .oauth(MCPOAuth.builder()
                        .type("oauth2")
                        .authorizationUrl(baseUrl + "/mcp/auth/authorize")
                        .tokenUrl(baseUrl + "/mcp/auth/token")
                        .scopes(new String[]{"crates:full"})
                        .build())
                .tools(List.of(
                        // Tool 1: Get user's library for taste context
                        MCPTool.builder()
                                .name("getUserLibrary")
                                .description("Get user's recent library albums for AI taste analysis")
                                .method("GET")
                                .path("/mcp/web/library")
                                .parameters(Map.of(
                                        "limit", MCPParameter.builder()
                                                .type("integer")
                                                .description("Number of recent albums to return (default 100)")
                                                .required(false)
                                                .defaultValue(100)
                                                .build()
                                ))
                                .build(),

                        // Tool 2: Search Spotify for albums
                        MCPTool.builder()
                                .name("searchSpotifyAlbums")
                                .description("Search Spotify for albums by artist and title")
                                .method("GET")
                                .path("/mcp/web/search/albums")
                                .parameters(Map.of(
                                        "q", MCPParameter.builder()
                                                .type("string")
                                                .description("Search query like 'Bon Iver For Emma' or 'Radiohead OK Computer'")
                                                .required(true)
                                                .build(),
                                        "limit", MCPParameter.builder()
                                                .type("integer")
                                                .description("Maximum results to return (default 10)")
                                                .required(false)
                                                .defaultValue(10)
                                                .build()
                                ))
                                .build(),

                        // Tool 3: Create new crate
                        MCPTool.builder()
                                .name("createCrate")
                                .description("Create a new crate with name and description")
                                .method("POST")
                                .path("/mcp/web/crates")
                                .parameters(Map.of(
                                        "name", MCPParameter.builder()
                                                .type("string")
                                                .description("Crate name")
                                                .required(true)
                                                .build(),
                                        "description", MCPParameter.builder()
                                                .type("string")
                                                .description("Crate description")
                                                .required(true)
                                                .build(),
                                        "isPublic", MCPParameter.builder()
                                                .type("boolean")
                                                .description("Make crate public for sharing")
                                                .required(false)
                                                .defaultValue(true)
                                                .build()
                                ))
                                .build(),

                        // Tool 4: Add album to crate
                        MCPTool.builder()
                                .name("addAlbumToCrate")
                                .description("Add a specific album to a crate using Spotify album ID")
                                .method("POST")
                                .path("/mcp/web/crates/{crateId}/albums")
                                .parameters(Map.of(
                                        "crateId", MCPParameter.builder()
                                                .type("string")
                                                .description("The crate ID")
                                                .required(true)
                                                .build(),
                                        "spotifyAlbumId", MCPParameter.builder()
                                                .type("string")
                                                .description("Spotify album ID")
                                                .required(true)
                                                .build()
                                ))
                                .build(),

                        // Tool 5: Get public crate link
                        MCPTool.builder()
                                .name("getPublicCrateLink")
                                .description("Generate public sharing link for a completed crate")
                                .method("GET")
                                .path("/mcp/web/crates/{crateId}/link")
                                .parameters(Map.of(
                                        "crateId", MCPParameter.builder()
                                                .type("string")
                                                .description("The crate ID")
                                                .required(true)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        return ResponseEntity.ok(manifest);
    }
}