package page.crates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class SpotifyAlbumNotFoundException extends RuntimeException {
    public SpotifyAlbumNotFoundException(String message) {
        super(message);
    }
}
