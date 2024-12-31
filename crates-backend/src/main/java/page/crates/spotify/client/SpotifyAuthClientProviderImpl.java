package page.crates.spotify.client;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import feign.Feign;
import feign.Logger;
import feign.form.FormEncoder;
import feign.slf4j.Slf4jLogger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.openfeign.support.SpringMvcContract;
import org.springframework.stereotype.Component;
import page.crates.spotify.client.interceptor.BasicAuthHeaderInterceptor;
import page.crates.spotify.client.interceptor.ContentTypeInterceptor;

import java.util.List;

@Component
public class SpotifyAuthClientProviderImpl implements SpotifyAuthClientProvider {

    @Value("${spotify.client-id}")
    private String clientId;
    @Value("${spotify.client-secret}")
    private String clientSecret;
    @Value("${spotify.accounts.uri}")
    private String accountsUri;

    @Override
    public SpotifyAuthClient get() {
        return Feign.builder()
                .requestInterceptor(new BasicAuthHeaderInterceptor(clientId, clientSecret))
                .requestInterceptor(new ContentTypeInterceptor())
                .logger(new Slf4jLogger(SpotifyAuthClient.class))
                .logLevel(Logger.Level.FULL)
                .encoder(new FormEncoder())
                .decoder(new SpotifyJacksonDecoder(List.of(new JavaTimeModule())))
                .contract(new SpringMvcContract())
                .target(SpotifyAuthClient.class, accountsUri);
    }

}
