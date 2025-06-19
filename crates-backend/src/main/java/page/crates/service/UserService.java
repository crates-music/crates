package page.crates.service;

import page.crates.entity.SpotifyUser;

public interface UserService {
    SpotifyUserCreation findOrCreateUserForCode(String code);
    
    SpotifyUser findBySpotifyId(String spotifyId);
}
