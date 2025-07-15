package page.crates.controller;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.mcp.MCPTokenResponse;
import page.crates.service.MCPAuthService;
import page.crates.service.SpotifyUserCreation;
import page.crates.service.UserService;
import page.crates.spotify.client.SpotifyAuth;
import page.crates.spotify.client.TokenResponse;

import java.io.IOException;

/**
 * OAuth proxy controller for ChatGPT Custom GPT integration
 * Handles the OAuth flow: ChatGPT → Crates → Spotify → back to ChatGPT
 */
@RestController
@RequestMapping("/mcp/auth")
@Slf4j
public class MCPOAuthController {
    
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private UserService userService;
    @Resource
    private MCPAuthService mcpAuthService;
    
    @Value("${crates.mcp.redirect-uri}")
    private String mcpRedirectUri;
    
    /**
     * Step 1: ChatGPT calls this to start OAuth flow
     * We redirect to Spotify OAuth with our own redirect URI
     */
    @GetMapping("/authorize")
    public void authorize(
            @RequestParam("client_id") String clientId, // ChatGPT's client ID (we ignore)
            @RequestParam("redirect_uri") String chatGptRedirectUri, // Where to send ChatGPT back
            @RequestParam("state") String state, // ChatGPT's state parameter
            @RequestParam(value = "scope", required = false) String scope,
            HttpServletResponse response) throws IOException {
        
        log.info("MCP OAuth authorize request from ChatGPT. State: {}, ChatGPT redirect: {}", state, chatGptRedirectUri);
        
        // Store ChatGPT's redirect URI and state so we can use them later
        String internalState = state + "|" + chatGptRedirectUri; // Combine for later parsing
        
        // Redirect to Spotify OAuth with our MCP redirect URI
        String spotifyAuthUrl = spotifyAuth.getAuthUrlWithPKCE(internalState, mcpRedirectUri);
        
        log.info("Redirecting to Spotify OAuth: {}", spotifyAuthUrl);
        response.sendRedirect(spotifyAuthUrl);
    }
    
    /**
     * Step 2: Spotify redirects back here after user consent
     * We handle the Spotify OAuth, then redirect back to ChatGPT
     */
    @GetMapping("/callback")
    public void callback(
            @RequestParam("code") String code,
            @RequestParam("state") String internalState,
            HttpServletResponse response) throws IOException {
        
        log.info("Spotify OAuth callback. Code: {}, State: {}", code, internalState);
        
        try {
            // Parse our combined state
            String[] stateParts = internalState.split("\\|", 2);
            if (stateParts.length != 2) {
                log.error("Invalid state format. Expected 'originalState|chatGptRedirectUri', got: {}", internalState);
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid state parameter");
                return;
            }
            String originalState = stateParts[0];
            String chatGptRedirectUri = stateParts[1];
            
            // Exchange code for Spotify tokens using PKCE with the same redirect URI used in authorization
            TokenResponse tokenResponse = spotifyAuth.getTokenWithPKCE(code, internalState, mcpRedirectUri);
            
            // Create or get user from Spotify token response (avoid double token exchange)
            SpotifyUserCreation userCreation = userService.createUserFromTokenResponse(tokenResponse);
            
            // Generate temporary API key for ChatGPT
            String apiKey = mcpAuthService.generateApiKey(userCreation.spotifyUser().getSpotifyId(), "crates:full");
            
            // Redirect back to ChatGPT with authorization code (we use our API key as the "code")
            String chatGptCallbackUrl = chatGptRedirectUri + 
                    "?code=" + apiKey + 
                    "&state=" + originalState;
                    
            log.info("Redirecting back to ChatGPT: {}", chatGptCallbackUrl);
            response.sendRedirect(chatGptCallbackUrl);
            
        } catch (Exception e) {
            log.error("Error in OAuth callback", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "OAuth flow failed");
        }
    }
    
    /**
     * Step 3: ChatGPT exchanges the "code" (our API key) for an access token
     * We just return the same API key as the access token
     */
    @PostMapping("/token")
    public ResponseEntity<MCPTokenResponse> token(
            @RequestParam("grant_type") String grantType,
            @RequestParam("code") String code, // This is actually our API key
            @RequestParam("redirect_uri") String redirectUri) {
        
        log.info("MCP token exchange. Grant type: {}, Code (API key): {}", grantType, code);
        
        // Validate the API key exists
        if (mcpAuthService.validateApiKey(code) == null) {
            log.warn("Invalid API key in token exchange: {}", code);
            return ResponseEntity.badRequest().build();
        }
        
        // Return the API key as the access token
        MCPTokenResponse tokenResponse = MCPTokenResponse.builder()
                .accessToken(code) // The API key becomes the access token
                .tokenType("Bearer")
                .expiresIn(86400L) // 24 hours
                .scope("crates:full")
                .build();
                
        log.info("Issued access token for ChatGPT");
        return ResponseEntity.ok(tokenResponse);
    }
}