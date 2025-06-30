package page.crates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String identifier) {
        super("User not found: " + identifier);
    }

    public UserNotFoundException(String identifier, String type) {
        super("User not found with " + type + ": " + identifier);
    }

    public UserNotFoundException(Long userId) {
        super("User not found with id: " + userId);
    }
}