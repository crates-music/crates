package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import page.crates.entity.SpotifyUser;
import page.crates.entity.Token;
import page.crates.exception.HandleAlreadyTakenException;
import page.crates.exception.UserNotFoundException;
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
    @Resource
    private HandleService handleService;

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
        // Auto-generate handle from spotifyId for new users
        if (user.getHandle() == null) {
            user.setHandle(handleService.handelize(user.getSpotifyId()));
        }
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

    /**
     * MCP-specific method to create user from existing TokenResponse
     * This avoids double token exchange in the MCP OAuth flow
     */
    @Override
    public SpotifyUserCreation createUserFromTokenResponse(TokenResponse tokenResponse) {
        final Token token = tokenMapper.map(tokenResponse);
        token.setCode(""); // MCP flow doesn't need to store the original code
        token.setAuthToken(RandomStringUtils.randomAlphanumeric(256));
        final Token savedToken = tokenRepository.save(token);
        return createOrUpdateUser(savedToken);
    }

    @Override
    public SpotifyUser findBySpotifyId(String spotifyId) {
        return spotifyUserRepository.findOneBySpotifyId(spotifyId)
                .orElseThrow(() -> new UserNotFoundException(spotifyId, "spotifyId"));
    }

    @Override
    public SpotifyUser findByHandleOrSpotifyId(String identifier) {
        // First try to find by custom handle
        Optional<SpotifyUser> userByHandle = spotifyUserRepository.findByHandle(identifier);
        if (userByHandle.isPresent()) {
            return userByHandle.get();
        }
        
        // Fall back to Spotify ID lookup
        return spotifyUserRepository.findOneBySpotifyId(identifier)
                .orElseThrow(() -> new UserNotFoundException(identifier));
    }

    @Override
    public SpotifyUser updateProfile(Long userId, String handle, String bio, Boolean privateProfile) {
        SpotifyUser user = spotifyUserRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        // Validate handle uniqueness if provided
        if (handle != null && !handle.trim().isEmpty()) {
            String trimmedHandle = handle.trim();
            Optional<SpotifyUser> existingUser = spotifyUserRepository.findByHandle(trimmedHandle);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new HandleAlreadyTakenException(trimmedHandle);
            }
            user.setHandle(trimmedHandle);
        }
        
        // Update bio if provided (can be null to clear it)
        if (bio != null) {
            user.setBio(bio.trim().isEmpty() ? null : bio.trim());
        }
        
        // Update privacy setting if provided
        if (privateProfile != null) {
            user.setPrivateProfile(privateProfile);
        }
        
        user.setUpdatedAt(systemTimeFacade.now());
        return spotifyUserRepository.save(user);
    }

    @Override
    public SpotifyUser getUser(Long userId) {
        return spotifyUserRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    @Override
    public Page<SpotifyUser> searchUsers(String search, Pageable pageable) {
        log.info("Searching users with term: {}", search);
        return spotifyUserRepository.searchUsers(search, pageable);
    }
}
