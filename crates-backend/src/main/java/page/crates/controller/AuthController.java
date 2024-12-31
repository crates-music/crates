package page.crates.controller;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import page.crates.service.LibrarySyncService;
import page.crates.service.SpotifyUserCreation;
import page.crates.service.UserService;
import page.crates.service.enums.LibrarySyncOption;
import page.crates.spotify.client.SpotifyAuth;
import page.crates.util.DelegatingUserContextRunnable;

import java.io.IOException;

@RestController
@RequestMapping("/v1/auth")
@Slf4j
public class AuthController {
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private UserService userService;
    @Resource
    private LibrarySyncService librarySyncService;

    @Value("${crates.auth.callback.uri}")
    private String callbackUri;

    @GetMapping("/callback")
    public void callback(final HttpServletResponse response,
                         final HttpServletRequest request,
                         final @RequestParam(value = "error", required = false) String error,
                         final @RequestParam(value = "state", required = false) String state,
                         final @RequestParam(value = "code", required = false) String code) throws IOException {
        if ("access_denied".equals(error)) {
            // TODO: they denied the shit, what do we do?
            return;
        }
        if (StringUtils.isBlank(code)) {
            // WHAT THE FUCK NO CODE??
            // TODO: do something here, maybe make them try again.
            return;
        }
        final SpotifyUserCreation spotifyUserCreation = userService.findOrCreateUserForCode(code);
        if (spotifyUserCreation.created()) {
            log.info("kicking off initial sync for user {}", spotifyUserCreation.spotifyUser().getSpotifyId());
            new Thread(new DelegatingUserContextRunnable(
                    () -> librarySyncService.synchronize(LibrarySyncOption.FIRST_SYNC),
                    spotifyUserCreation.spotifyUser())).start();
        } else {
            log.info("kicking off library sync for user {}", spotifyUserCreation.spotifyUser().getSpotifyId());
            new Thread(new DelegatingUserContextRunnable(
                    () -> librarySyncService.synchronize(),
                    spotifyUserCreation.spotifyUser())).start();
        }
        final String callback = UriComponentsBuilder.fromUriString(callbackUri)
                .queryParam("token", spotifyUserCreation.spotifyUser().getToken().getAuthToken())
                .build()
                .toUriString();
        response.sendRedirect(callback);
    }

    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        response.sendRedirect(spotifyAuth.getAuthUrl(""));
    }
}
