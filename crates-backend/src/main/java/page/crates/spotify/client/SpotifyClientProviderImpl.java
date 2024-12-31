package page.crates.spotify.client;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import feign.Feign;
import feign.Retryer;
import feign.jackson.JacksonEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.openfeign.support.SpringMvcContract;
import org.springframework.stereotype.Component;
import page.crates.spotify.client.interceptor.BearerTokenHeaderInterceptor;

import java.util.List;

@Component
public class SpotifyClientProviderImpl implements SpotifyClientProvider {
    @Value("${spotify.api.base.uri}")
    private String baseUri;

    @Override
    public SpotifyClient get(final Context context) {
        return Feign.builder()
                .retryer(new Retryer.Default(100, 10000, 10))
                .requestInterceptor(new BearerTokenHeaderInterceptor(context.token()))
                .encoder(new JacksonEncoder(List.of(new JavaTimeModule())))
                .decoder(new SpotifyJacksonDecoder(List.of(new JavaTimeModule())))
                .contract(new SpringMvcContract())
                .target(SpotifyClient.class, baseUri);
    }
}
