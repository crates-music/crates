package page.crates.spotify.client.interceptor;

import com.google.common.base.Joiner;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.apache.commons.codec.binary.Base64;

import java.nio.charset.StandardCharsets;

public class BasicAuthHeaderInterceptor  implements RequestInterceptor {
    private final String username;
    private final String password;

    public BasicAuthHeaderInterceptor(final String username, final String password) {
        this.username = username;
        this.password = password;
    }


    @Override
    public void apply(RequestTemplate requestTemplate) {
        requestTemplate.header("Authorization", getEncodedToken());
    }

    private String getEncodedToken() {
        final String value = Base64.encodeBase64String(
                Joiner.on(":").join(username, password)
                        .getBytes(StandardCharsets.UTF_8));
        return "Basic " + value;
    }
}
