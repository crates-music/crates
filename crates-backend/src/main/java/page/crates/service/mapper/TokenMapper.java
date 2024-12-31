package page.crates.service.mapper;

import org.springframework.stereotype.Component;
import page.crates.spotify.client.TokenResponse;
import page.crates.entity.Token;
import page.crates.util.SystemTimeFacade;

import jakarta.annotation.Resource;

@Component
public class TokenMapper {
    @Resource
    private SystemTimeFacade systemTimeFacade;

    public Token map(TokenResponse api) {
        if (null == api) {
            return null;
        }
        Token token = new Token();
        token.setAccessToken(api.getAccessToken());
        token.setRefreshToken(api.getRefreshToken());
        token.setExpiration(systemTimeFacade.now().plusSeconds(api.getExpiresIn()));
        return token;
    }
}
