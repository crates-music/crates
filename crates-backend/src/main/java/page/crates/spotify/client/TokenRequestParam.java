package page.crates.spotify.client;

public enum TokenRequestParam {
    GRANT_TYPE("grant_type"),
    CODE("code"),
    REDIRECT_URI("redirect_uri"),
    REFRESH_TOKEN("refresh_token"),
    CODE_CHALLENGE("code_challenge"),
    CODE_VERIFIER("code_verifier"),
    CODE_CHALLENGE_METHOD("code_challenge_method");

    private final String param;

    TokenRequestParam(final String param) {
        this.param = param;
    }

    public String param() {
        return param;
    }
}
