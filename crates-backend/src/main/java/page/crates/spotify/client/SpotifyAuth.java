package page.crates.spotify.client;

public interface SpotifyAuth {

    TokenResponse getServiceToken();

    TokenResponse getToken(String code);
    
    TokenResponse getTokenWithPKCE(String code, String state);
    
    TokenResponse getTokenWithPKCE(String code, String state, String customRedirectUri);

    TokenResponse refreshToken(String refreshToken);

    String getAuthUrl(String state);
    
    String getAuthUrlWithPKCE(String state);
    
    String getAuthUrlWithPKCE(String state, String customRedirectUri);
}
