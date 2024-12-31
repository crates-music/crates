package page.crates.spotify.client;

import com.google.common.base.Joiner;
import com.google.common.collect.Maps;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import page.crates.spotify.client.api.AuthorizationScope;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class SpotifyAuthImpl implements SpotifyAuth {
    @Resource
    private SpotifyAuthClientProvider spotifyAuthClientProvider;

    @Value("${spotify.authorize.endpoint}")
    private String authorizeEndpoint;
    @Value("${spotify.client-id}")
    private String clientId;
    @Value("${spotify.redirect-uri}")
    private String redirectUri;


    private SpotifyAuthClient getAuthClient() {
        return spotifyAuthClientProvider.get();
    }

    @Override
    public String getAuthUrl(String state) {
        return UriComponentsBuilder.fromHttpUrl(authorizeEndpoint)
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", getScopes())
                .queryParam("state", state)
                .build()
                .encode()
                .toUriString();
    }

    private String getScopes() {
        return Joiner.on(" ").join(
                Stream.of(AuthorizationScope.values())
                        .map(AuthorizationScope::scope)
                        .collect(Collectors.toSet()));
    }

    @Override
    public TokenResponse getServiceToken() {
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "client_credentials");
        return getAuthClient().getToken(params);
    }

    @Override
    public TokenResponse getToken(String code) {
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "authorization_code");
        params.put(TokenRequestParam.CODE.param(), code);
        params.put(TokenRequestParam.REDIRECT_URI.param(), redirectUri);
        return getAuthClient().getToken(params);
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {
        final Map<String, String> params = Maps.newHashMap();
        params.put(TokenRequestParam.GRANT_TYPE.param(), "refresh_token");
        params.put(TokenRequestParam.REFRESH_TOKEN.param(), refreshToken);
        return getAuthClient().getToken(params);
    }
}
