package page.crates.controller;

import feign.FeignException;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.ProfileUpdateRequest;
import page.crates.controller.api.SpotifyUser;
import page.crates.controller.api.mapper.UserMapper;
import page.crates.exception.ExpiredTokenException;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.CurrentUserService;
import page.crates.service.UserService;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;

@RestController
@RequestMapping("/v1/user")
public class UserController {
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private UserMapper userMapper;
    @Resource
    private UserService userService;
    @Resource
    private Spotify spotify;

    @GetMapping(value = "/current")
    @SpotifyAuthorization
    public SpotifyUser getCurrentUser() {
        page.crates.entity.SpotifyUser user = currentUserService.getCurrentUser();
        try {
            spotify.getCurrentUser(Context.forToken(user.getToken().getAccessToken()));
        } catch (FeignException e) {
            if (e.status() == HttpStatus.UNAUTHORIZED.value()) {
                throw new ExpiredTokenException();
            }
        }
        return userMapper.map(user);
    }

    @PutMapping(value = "/profile")
    @SpotifyAuthorization
    public SpotifyUser updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        page.crates.entity.SpotifyUser updatedUser = userService.updateProfile(
                currentUser.getId(), 
                request.getHandle(), 
                request.getBio()
        );
        return userMapper.map(updatedUser);
    }
}
