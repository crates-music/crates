package page.crates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class SpotifyArtistNotFoundException extends RuntimeException {
    public SpotifyArtistNotFoundException(String message) {
        super(message);
    }
}
