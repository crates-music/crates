package page.crates.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MCP OAuth configuration - flexible for different auth strategies
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPOAuth {
    private String authorizationUrl;
    private String tokenUrl;
    private String clientId;
    private String[] scopes;
    private String type; // "oauth2", "bearer", "none"
}