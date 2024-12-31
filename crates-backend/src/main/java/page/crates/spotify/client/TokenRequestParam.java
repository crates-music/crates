package page.crates.spotify.client;

public enum TokenRequestParam {
    GRANT_TYPE("grant_type"),
    CODE("code"),
    REDIRECT_URI("redirect_uri"),
    REFRESH_TOKEN("refresh_token");

    private final String param;

    TokenRequestParam(final String param) {
        this.param = param;
    }

    public String param() {
        return param;
    }
}
