package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import page.crates.entity.SpotifyUser;
import page.crates.entity.Token;
import page.crates.repository.SpotifyUserRepository;
import page.crates.repository.TokenRepository;
import page.crates.service.mapper.SpotifyUserMapper;
import page.crates.service.mapper.TokenMapper;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.spotify.client.SpotifyAuth;
import page.crates.spotify.client.TokenResponse;
import page.crates.util.SystemTimeFacade;

import java.util.Optional;

@Service
@Slf4j
public class UserServiceImpl implements UserService {
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private Spotify spotify;
    @Resource
    private TokenRepository tokenRepository;
    @Resource
    private SpotifyUserRepository spotifyUserRepository;
    @Resource
    private TokenMapper tokenMapper;
    @Resource
    private SpotifyUserMapper spotifyUserMapper;
    @Resource
    private SystemTimeFacade systemTimeFacade;

    private SpotifyUserCreation createOrUpdateUser(Token token) {
        final Context context = Context.forToken(token.getAccessToken());
        SpotifyUser user = spotifyUserMapper.map(spotify.getCurrentUser(context));
        final Optional<SpotifyUser> foundUser = spotifyUserRepository.findOneBySpotifyId(user.getSpotifyId());
        if (foundUser.isPresent()) {
            final SpotifyUser found = foundUser.get();
            log.info("Updating token on existing user {} -- id: {} -- spotifyId: {}",
                    found.getEmail(), found.getId(), found.getSpotifyId());
            final Token oldToken = found.getToken();
            found.setToken(token);
            found.setUpdatedAt(systemTimeFacade.now());
            final SpotifyUser updated = spotifyUserRepository.save(found);
            tokenRepository.delete(oldToken);
            return new SpotifyUserCreation(updated, false);
        }
        user.setToken(token);
        user.setCreatedAt(systemTimeFacade.now());
        user.setUpdatedAt(systemTimeFacade.now());
        log.info("Creating new user for {} [ {} ]", user.getEmail(), user.getSpotifyId());
        return new SpotifyUserCreation(spotifyUserRepository.save(user), true);
    }

    @Override
    public SpotifyUserCreation findOrCreateUserForCode(String code) {
        final TokenResponse tokenResponse = spotifyAuth.getToken(code);
        final Token token = tokenMapper.map(tokenResponse);
        token.setCode(code);
        token.setAuthToken(RandomStringUtils.randomAlphanumeric(256));
        final Token savedToken = tokenRepository.save(token);
        return createOrUpdateUser(savedToken);
    }

    @Override
    public SpotifyUser findBySpotifyId(String spotifyId) {
        return spotifyUserRepository.findOneBySpotifyId(spotifyId)
                .orElseThrow(() -> new RuntimeException("User not found with spotifyId: " + spotifyId));
    }
}
