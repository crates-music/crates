package page.crates.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration to allow public access to existing v1 endpoints and MCP endpoints
 * while keeping them completely separate from any Spring Security processing
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    /**
     * Security filter chain for MCP and public endpoints - allows all access
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(request -> {
                String path = request.getRequestURI();
                // Apply to MCP endpoints, well-known endpoints, actuator, and v1 auth endpoints
                return path.startsWith("/mcp/") || 
                       path.startsWith("/.well-known/") || 
                       path.startsWith("/actuator/") ||
                       path.startsWith("/v1/");
            })
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()  // Allow all access to these endpoints
            )
            .csrf(csrf -> csrf.disable()); // Disable CSRF for API endpoints

        return http.build();
    }

    /**
     * Default security filter chain for any other endpoints (if they exist)
     */
    @Bean
    @Order(2)
    public SecurityFilterChain defaultFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()  // Allow all for now, can be tightened later
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}