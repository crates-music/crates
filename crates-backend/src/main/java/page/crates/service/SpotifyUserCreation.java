package page.crates.service;

import page.crates.entity.SpotifyUser;

public record SpotifyUserCreation(SpotifyUser spotifyUser,
                                  boolean created) {
}
