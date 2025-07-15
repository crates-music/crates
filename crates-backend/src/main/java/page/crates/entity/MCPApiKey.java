package page.crates.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.util.EncryptionConverter;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "mcp_api_key")
public class MCPApiKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_key", nullable = false)
    @Convert(converter = EncryptionConverter.class)
    private String apiKey;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "scope", nullable = false)
    private String scope;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}