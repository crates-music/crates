package page.crates.service;

import org.springframework.stereotype.Service;
import page.crates.entity.SpotifyUser;
import page.crates.security.UserContextHolder;

@Service
public class CurrentUserServiceImpl implements CurrentUserService {
    @Override
    public SpotifyUser getCurrentUser() {
        return UserContextHolder.getUserContext();
    }
}
