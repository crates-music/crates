package page.crates.spotify.client;

public interface SpotifyClientProvider {
    SpotifyClient get(Context context);
}
