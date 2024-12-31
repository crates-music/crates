package page.crates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class LibraryNotFoundException extends RuntimeException {
    public LibraryNotFoundException(Long id) {
        super(String.valueOf(id));
    }
}
