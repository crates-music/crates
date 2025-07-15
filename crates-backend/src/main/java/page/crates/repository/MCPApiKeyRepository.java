package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import page.crates.entity.MCPApiKey;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MCPApiKeyRepository extends JpaRepository<MCPApiKey, Long> {
    
    /**
     * Find API key by the encrypted key value for validation
     */
    Optional<MCPApiKey> findByApiKey(String apiKey);
    
    /**
     * Find all active (non-expired) API keys for a user
     */
    List<MCPApiKey> findByUserIdAndExpiresAtAfter(String userId, Instant now);
    
    /**
     * Delete all expired API keys for cleanup
     */
    @Modifying
    @Query("DELETE FROM MCPApiKey m WHERE m.expiresAt < :now")
    int deleteByExpiresAtBefore(@Param("now") Instant now);
}