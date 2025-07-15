package page.crates.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Temporary API key for ChatGPT access to user's Crates account
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPApiKey {
    private String apiKey;
    private String userId; // Spotify user ID
    private Instant createdAt;
    private Instant expiresAt;
    private String scope;
}