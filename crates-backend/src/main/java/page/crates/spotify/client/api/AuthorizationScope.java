package page.crates.spotify.client.api;

public enum AuthorizationScope {
//    USER_READ_EMAIL("user-read-email"),
    USER_LIBRARY_READ("user-library-read"),
//    USER_LIBRARY_MODIFY("user-library-modify"),
//    USER_FOLLOW_READ("user-follow-read"),
//    USER_FOLLOW_MODIFY("user-follow-modify"),
//    PLAYLIST_READ_PRIVATE("playlist-read-private"),
//    PLAYLIST_READ_COLLABORATIVE("playlist-read-collaborative")
    ;

    private final String scope;

    AuthorizationScope(final String scope) {
        this.scope = scope;
    }

    public String scope() {
        return scope;
    }
}
