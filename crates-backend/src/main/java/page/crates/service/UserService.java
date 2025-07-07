package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.SpotifyUser;

public interface UserService {
    SpotifyUserCreation findOrCreateUserForCode(String code);
    
    SpotifyUser findBySpotifyId(String spotifyId);
    
    SpotifyUser findByHandleOrSpotifyId(String identifier);
    
    SpotifyUser updateProfile(Long userId, String handle, String bio, Boolean privateProfile);
    
    SpotifyUser getUser(Long userId);
    
    Page<SpotifyUser> searchUsers(String search, Pageable pageable);
}
