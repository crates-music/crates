package page.crates.spotify.client.interceptor;

import feign.RequestInterceptor;
import feign.RequestTemplate;

public class BearerTokenHeaderInterceptor implements RequestInterceptor {
    private final String token;

    public BearerTokenHeaderInterceptor(String token) {
        this.token = token;
    }

    @Override
    public void apply(RequestTemplate template) {
        template.header("Authorization", "Bearer " + token);
    }
}
