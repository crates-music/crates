package page.crates.security;

import page.crates.entity.SpotifyUser;

public class UserContextHolder {
    private static final ThreadLocal<SpotifyUser> userContext = new ThreadLocal<>();

    public static SpotifyUser getUserContext() {
        return userContext.get();
    }

    public static void setUserContext(SpotifyUser user) {
        userContext.set(user);
    }
}
