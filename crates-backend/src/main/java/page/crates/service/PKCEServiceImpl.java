package page.crates.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PKCEServiceImpl implements PKCEService {
    
    private static final String CODE_VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    private static final int CODE_VERIFIER_LENGTH = 128; // Maximum length for security
    private static final int VERIFIER_EXPIRY_MINUTES = 10; // Code verifiers expire after 10 minutes
    
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, VerifierEntry> verifierStore = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
    
    public PKCEServiceImpl() {
        // Schedule cleanup of expired verifiers every 5 minutes
        cleanupScheduler.scheduleAtFixedRate(this::cleanupExpiredVerifiers, 5, 5, TimeUnit.MINUTES);
    }
    
    @Override
    public String generateCodeVerifier() {
        StringBuilder verifier = new StringBuilder(CODE_VERIFIER_LENGTH);
        for (int i = 0; i < CODE_VERIFIER_LENGTH; i++) {
            int randomIndex = secureRandom.nextInt(CODE_VERIFIER_CHARS.length());
            verifier.append(CODE_VERIFIER_CHARS.charAt(randomIndex));
        }
        String result = verifier.toString();
        log.debug("Generated code verifier of length: {}", result.length());
        return result;
    }
    
    @Override
    public String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.UTF_8));
            String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
            log.debug("Generated code challenge from verifier");
            return challenge;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    @Override
    public void storeCodeVerifier(String state, String codeVerifier) {
        long expiryTime = System.currentTimeMillis() + (VERIFIER_EXPIRY_MINUTES * 60 * 1000);
        verifierStore.put(state, new VerifierEntry(codeVerifier, expiryTime));
        log.debug("Stored code verifier for state: {}", state);
    }
    
    @Override
    public String retrieveAndRemoveCodeVerifier(String state) {
        VerifierEntry entry = verifierStore.remove(state);
        if (entry == null) {
            log.warn("No code verifier found for state: {}", state);
            return null;
        }
        
        if (System.currentTimeMillis() > entry.expiryTime) {
            log.warn("Code verifier expired for state: {}", state);
            return null;
        }
        
        log.debug("Retrieved and removed code verifier for state: {}", state);
        return entry.codeVerifier;
    }
    
    private void cleanupExpiredVerifiers() {
        long currentTime = System.currentTimeMillis();
        
        int initialSize = verifierStore.size();
        boolean removed = verifierStore.entrySet().removeIf(entry -> {
            return currentTime > entry.getValue().expiryTime;
        });
        
        if (removed) {
            int removedCount = initialSize - verifierStore.size();
            log.debug("Cleaned up {} expired code verifiers", removedCount);
        }
    }
    
    private static class VerifierEntry {
        final String codeVerifier;
        final long expiryTime;
        
        VerifierEntry(String codeVerifier, long expiryTime) {
            this.codeVerifier = codeVerifier;
            this.expiryTime = expiryTime;
        }
    }
}