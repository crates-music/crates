package page.crates.spotify.client;

import com.google.common.base.Joiner;
import com.google.common.collect.Maps;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import page.crates.service.PKCEService;
import page.crates.spotify.client.api.AuthorizationScope;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class SpotifyAuthImpl implements SpotifyAuth {
    @Resource
    private SpotifyAuthClientProvider spotifyAuthClientProvider;
    @Resource
    private PKCEService pkceService;

    @Value("${spotify.authorize.endpoint}")
    private String authorizeEndpoint;
    @Value("${spotify.client-id}")
    private String clientId;
    @Value("${spotify.redirect-uri}")
    private String redirectUri;

    // Cached service token
    private TokenResponse cachedServiceToken;
    private long tokenExpiresAt = 0;

    private SpotifyAuthClient getAuthClient() {
        return spotifyAuthClientProvider.get();
    }

    @Override
    public String getAuthUrl(String state) {
        return UriComponentsBuilder.fromHttpUrl(authorizeEndpoint)
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", getScopes())
                .queryParam("state", state)
                .build()
                .encode()
                .toUriString();
    }

    private String getScopes() {
        return Joiner.on(" ").join(
                Stream.of(AuthorizationScope.values())
                        .map(AuthorizationScope::scope)
                        .collect(Collectors.toSet()));
    }

    @Override
    public synchronized TokenResponse getServiceToken() {
        // Check if we have a cached token that's still valid
        long now = System.currentTimeMillis();
        if (cachedServiceToken != null && now < tokenExpiresAt) {
            return cachedServiceToken;
        }

        // Get new token from Spotify
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "client_credentials");
        cachedServiceToken = getAuthClient().getToken(params);

        // Cache expires 5 minutes before actual expiration for safety
        tokenExpiresAt = now + ((cachedServiceToken.getExpiresIn() - 300) * 1000L);

        return cachedServiceToken;
    }

    @Override
    public TokenResponse getToken(String code) {
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "authorization_code");
        params.put(TokenRequestParam.CODE.param(), code);
        params.put(TokenRequestParam.REDIRECT_URI.param(), redirectUri);
        return getAuthClient().getToken(params);
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "refresh_token");
        params.put(TokenRequestParam.REFRESH_TOKEN.param(), refreshToken);
        return getAuthClient().getToken(params);
    }
    
    @Override
    public String getAuthUrlWithPKCE(String state) {
        return getAuthUrlWithPKCE(state, redirectUri);
    }
    
    @Override
    public String getAuthUrlWithPKCE(String state, String customRedirectUri) {
        // Generate PKCE parameters
        String codeVerifier = pkceService.generateCodeVerifier();
        String codeChallenge = pkceService.generateCodeChallenge(codeVerifier);
        
        // Store the code verifier for later retrieval
        pkceService.storeCodeVerifier(state, codeVerifier);
        
        return UriComponentsBuilder.fromHttpUrl(authorizeEndpoint)
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", customRedirectUri)
                .queryParam("scope", getScopes())
                .queryParam("state", state)
                .queryParam("code_challenge", codeChallenge)
                .queryParam("code_challenge_method", "S256")
                .build()
                .encode()
                .toUriString();
    }
    
    @Override
    public TokenResponse getTokenWithPKCE(String code, String state) {
        return getTokenWithPKCE(code, state, redirectUri);
    }
    
    @Override
    public TokenResponse getTokenWithPKCE(String code, String state, String customRedirectUri) {
        // Retrieve the code verifier
        String codeVerifier = pkceService.retrieveAndRemoveCodeVerifier(state);
        if (codeVerifier == null) {
            throw new IllegalStateException("Code verifier not found or expired for state: " + state);
        }
        
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "authorization_code");
        params.put(TokenRequestParam.CODE.param(), code);
        params.put(TokenRequestParam.REDIRECT_URI.param(), customRedirectUri);
        params.put(TokenRequestParam.CODE_VERIFIER.param(), codeVerifier);
        return getAuthClient().getToken(params);
    }
}
