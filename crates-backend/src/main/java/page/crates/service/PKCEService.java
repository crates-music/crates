package page.crates.service;

public interface PKCEService {
    /**
     * Generates a cryptographically secure code verifier for PKCE flow
     * @return A random string between 43-128 characters, URL-safe
     */
    String generateCodeVerifier();
    
    /**
     * Creates a code challenge from a code verifier using SHA256
     * @param codeVerifier The code verifier to hash
     * @return Base64URL-encoded SHA256 hash of the verifier
     */
    String generateCodeChallenge(String codeVerifier);
    
    /**
     * Stores a code verifier temporarily for the authorization flow
     * @param state The state parameter from OAuth flow
     * @param codeVerifier The verifier to store
     */
    void storeCodeVerifier(String state, String codeVerifier);
    
    /**
     * Retrieves and removes a stored code verifier
     * @param state The state parameter from OAuth flow
     * @return The stored code verifier, or null if not found/expired
     */
    String retrieveAndRemoveCodeVerifier(String state);
}