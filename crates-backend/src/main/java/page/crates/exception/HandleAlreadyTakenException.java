package page.crates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class HandleAlreadyTakenException extends RuntimeException {

    public HandleAlreadyTakenException(String handle) {
        super("Handle already taken: " + handle);
    }
}