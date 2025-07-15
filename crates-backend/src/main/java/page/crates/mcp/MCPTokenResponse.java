package page.crates.mcp;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OAuth token response for ChatGPT Custom GPT integration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPTokenResponse {
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("token_type")
    private String tokenType; // "Bearer"
    
    @JsonProperty("expires_in")
    private Long expiresIn; // seconds
    
    @JsonProperty("scope")
    private String scope;
}