package page.crates.spotify.client.interceptor;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.http.MediaType;

import java.util.Collections;

public class ContentTypeInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        template.header("Content-Type", Collections.emptyList()); // clear it out.
        template.header("Content-Type", MediaType.APPLICATION_FORM_URLENCODED_VALUE);
    }
}
