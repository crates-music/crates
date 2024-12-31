package page.crates.spotify.client;

public interface SpotifyAuth {

    TokenResponse getServiceToken();

    TokenResponse getToken(String code);

    TokenResponse refreshToken(String refreshToken);

    String getAuthUrl(String state);
}
