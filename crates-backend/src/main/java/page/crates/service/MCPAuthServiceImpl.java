package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.mcp.MCPApiKey;
import page.crates.repository.MCPApiKeyRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class MCPAuthServiceImpl implements MCPAuthService {
    
    private static final int API_KEY_LENGTH = 32;
    private static final long API_KEY_EXPIRY_HOURS = 24; // 24 hour expiry
    
    private final SecureRandom secureRandom = new SecureRandom();
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
    
    @Resource
    private MCPApiKeyRepository mcpApiKeyRepository;
    
    public MCPAuthServiceImpl() {
        // Schedule cleanup every hour
        cleanupScheduler.scheduleAtFixedRate(this::cleanupExpiredKeys, 1, 1, TimeUnit.HOURS);
    }
    
    @Override
    @Transactional
    public String generateApiKey(String spotifyUserId, String scope) {
        // Generate secure API key
        byte[] randomBytes = new byte[API_KEY_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String apiKey = "crates_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        
        // Create expiry time
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(API_KEY_EXPIRY_HOURS * 3600);
        
        // Save to database
        page.crates.entity.MCPApiKey entity = page.crates.entity.MCPApiKey.builder()
                .apiKey(apiKey)
                .userId(spotifyUserId)
                .createdAt(now)
                .expiresAt(expiresAt)
                .scope(scope)
                .build();
                
        mcpApiKeyRepository.save(entity);
        
        log.info("Generated API key for user: {} (expires: {})", spotifyUserId, expiresAt);
        return apiKey;
    }
    
    @Override
    @Transactional
    public MCPApiKey validateApiKey(String apiKey) {
        Optional<page.crates.entity.MCPApiKey> entityOpt = mcpApiKeyRepository.findByApiKey(apiKey);
        
        if (entityOpt.isEmpty()) {
            log.warn("Invalid API key: {}", apiKey);
            return null;
        }
        
        page.crates.entity.MCPApiKey entity = entityOpt.get();
        
        if (Instant.now().isAfter(entity.getExpiresAt())) {
            log.warn("Expired API key: {} (expired: {})", apiKey, entity.getExpiresAt());
            mcpApiKeyRepository.delete(entity);
            return null;
        }
        
        // Convert entity to service layer DTO
        return MCPApiKey.builder()
                .apiKey(entity.getApiKey())
                .userId(entity.getUserId())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .scope(entity.getScope())
                .build();
    }
    
    @Override
    @Transactional
    public void revokeApiKey(String apiKey) {
        Optional<page.crates.entity.MCPApiKey> entityOpt = mcpApiKeyRepository.findByApiKey(apiKey);
        if (entityOpt.isPresent()) {
            page.crates.entity.MCPApiKey entity = entityOpt.get();
            mcpApiKeyRepository.delete(entity);
            log.info("Revoked API key for user: {}", entity.getUserId());
        }
    }
    
    @Override
    @Transactional
    public void cleanupExpiredKeys() {
        Instant now = Instant.now();
        int removedCount = mcpApiKeyRepository.deleteByExpiresAtBefore(now);
        
        if (removedCount > 0) {
            log.info("Cleaned up {} expired API keys", removedCount);
        }
    }
}