package page.crates.spotify.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.Map;

@FeignClient(name = "spotify-auth-client")
public interface SpotifyAuthClient {
    @RequestMapping(value = "/api/token", method = RequestMethod.POST, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    TokenResponse getToken(Map<String, ?> parameters);
}
