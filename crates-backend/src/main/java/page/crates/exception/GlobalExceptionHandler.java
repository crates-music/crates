package page.crates.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import page.crates.security.StructuredLogEntry;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(
            UserNotFoundException ex, WebRequest request) {
        
        // Log at debug level to reduce noise for legitimate "not found" cases
        log.debug("User not found", 
            new StructuredLogEntry()
                .withAction("user_lookup")
                .withError("user_not_found")
                .with("message", ex.getMessage())
                .with("requestUri", request.getDescription(false))
        );

        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.NOT_FOUND,
            "User not found",
            "The requested user could not be found",
            request
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CrateNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleCrateNotFoundException(
            CrateNotFoundException ex, WebRequest request) {
        
        log.debug("Crate not found", 
            new StructuredLogEntry()
                .withAction("crate_lookup")
                .withError("crate_not_found")
                .with("message", ex.getMessage())
                .with("requestUri", request.getDescription(false))
        );

        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.NOT_FOUND,
            "Crate not found",
            "The requested crate could not be found or is private",
            request
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(HandleAlreadyTakenException.class)
    public ResponseEntity<Map<String, Object>> handleHandleAlreadyTakenException(
            HandleAlreadyTakenException ex, WebRequest request) {
        
        log.info("Handle conflict", 
            new StructuredLogEntry()
                .withAction("update_profile")
                .withError("handle_conflict")
                .with("message", ex.getMessage())
                .with("requestUri", request.getDescription(false))
        );

        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.CONFLICT,
            "Handle already taken",
            "The requested handle is already in use by another user",
            request
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedAccessException(
            UnauthorizedAccessException ex, WebRequest request) {
        
        log.warn("Unauthorized access attempt", 
            new StructuredLogEntry()
                .withAction("access_control")
                .withError("unauthorized_access")
                .with("message", ex.getMessage())
                .with("requestUri", request.getDescription(false))
        );

        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Unauthorized",
            "You are not authorized to access this resource",
            request
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, WebRequest request) {
        
        // Log unexpected exceptions at error level with full details
        log.error("Unexpected exception occurred", 
            new StructuredLogEntry()
                .withAction("generic_error_handling")
                .withError("unexpected_exception")
                .with("exceptionType", ex.getClass().getSimpleName())
                .with("message", ex.getMessage())
                .with("requestUri", request.getDescription(false))
        );

        Map<String, Object> errorResponse = createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Internal server error",
            "An unexpected error occurred. Please try again later.",
            request
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Map<String, Object> createErrorResponse(HttpStatus status, String error, String message, WebRequest request) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", extractPath(request.getDescription(false)));
        return errorResponse;
    }

    private String extractPath(String requestDescription) {
        // Extract path from "uri=/v1/public/user/admin.php"
        if (requestDescription.startsWith("uri=")) {
            return requestDescription.substring(4);
        }
        return requestDescription;
    }
}