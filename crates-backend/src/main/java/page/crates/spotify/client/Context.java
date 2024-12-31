package page.crates.spotify.client;

public record Context(String token) {

    public static Context forToken(String token) {
        return new Context(token);
    }
}
