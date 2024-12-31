package page.crates.service;

public interface UserService {
    SpotifyUserCreation findOrCreateUserForCode(String code);
}
