package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import page.crates.entity.SpotifyUser;
import page.crates.entity.Token;
import page.crates.repository.TokenRepository;
import page.crates.security.UserContextHolder;
import page.crates.spotify.client.SpotifyAuth;
import page.crates.spotify.client.TokenResponse;
import page.crates.util.SystemTimeFacade;

@Service
@Slf4j
public class UserTokenServiceImpl implements UserTokenService {
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private SystemTimeFacade systemTimeFacade;
    @Resource
    private TokenRepository tokenRepository;
    @Resource
    private CurrentUserService currentUserService;

    @Override
    public void refreshToken() {
        final SpotifyUser spotifyUser = currentUserService.getCurrentUser();
        final TokenResponse tokenResponse = spotifyAuth.refreshToken(spotifyUser.getToken().getRefreshToken());
        final Token token = spotifyUser.getToken();
        token.setAccessToken(tokenResponse.getAccessToken());
        token.setExpiration(systemTimeFacade.now().plusSeconds(tokenResponse.getExpiresIn()));
        final Token saved = tokenRepository.save(token);
        spotifyUser.setToken(saved);
        UserContextHolder.setUserContext(spotifyUser);
    }
}
