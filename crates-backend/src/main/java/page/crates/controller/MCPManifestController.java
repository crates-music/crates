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

                        // Tool 2: List user's crates
                        MCPTool.builder()
                                .name("getUserCrates")
                                .description("List all user's crates (public and private) with optional search")
                                .method("GET")
                                .path("/mcp/web/crates")
                                .parameters(Map.of(
                                        "search", MCPParameter.builder()
                                                .type("string")
                                                .description("Optional search term to filter crates by name")
                                                .required(false)
                                                .build()
                                ))
                                .build(),

                        // Tool 3: Create crate with albums (consolidated)
                        MCPTool.builder()
                                .name("createCrateWithAlbums")
                                .description("Create a new crate and add multiple albums in one operation. Provide album references (title + artist), backend handles matching.")
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
                                                .required(false)
                                                .build(),
                                        "isPublic", MCPParameter.builder()
                                                .type("boolean")
                                                .description("Make crate public for sharing")
                                                .required(false)
                                                .defaultValue(false)
                                                .build(),
                                        "albums", MCPParameter.builder()
                                                .type("array")
                                                .description("Array of album references with 'title' and 'artist' fields")
                                                .required(false)
                                                .build()
                                ))
                                .build(),

                        // Tool 4: Add albums to existing crate (consolidated)
                        MCPTool.builder()
                                .name("addAlbumsToCrate")
                                .description("Add multiple albums to existing crate (additive). Provide album references (title + artist), backend handles matching.")
                                .method("PUT")
                                .path("/mcp/web/crates/{crateId}/albums")
                                .parameters(Map.of(
                                        "crateId", MCPParameter.builder()
                                                .type("string")
                                                .description("The crate ID")
                                                .required(true)
                                                .build(),
                                        "albums", MCPParameter.builder()
                                                .type("array")
                                                .description("Array of album references with 'title' and 'artist' fields")
                                                .required(true)
                                                .build()
                                ))
                                .build()

                ))
                .build();

        return ResponseEntity.ok(manifest);
    }
}