package page.crates.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration for MCP endpoints to allow external AI platforms access
 */
@Configuration
public class MCPCorsConfiguration {
    
    @Bean
    public CorsConfigurationSource mcpCorsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow specific origins (add ChatGPT, Claude, etc.)
        configuration.setAllowedOriginPatterns(List.of(
                "https://chatgpt.com",
                "https://claude.ai", 
                "https://*.openai.com",
                "https://*.anthropic.com",
                "http://localhost:*", // For local testing
                "https://localhost:*"  // For local HTTPS testing
        ));
        
        // Allow common HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"
        ));
        
        // Allow common headers
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Type", 
                "Accept",
                "Origin",
                "X-Requested-With"
        ));
        
        // Allow credentials for OAuth flow
        configuration.setAllowCredentials(true);
        
        // Cache preflight responses for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        
        // Apply CORS to MCP endpoints
        source.registerCorsConfiguration("/mcp/**", configuration);
        source.registerCorsConfiguration("/.well-known/**", configuration);
        
        return source;
    }
}