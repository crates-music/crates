package page.crates.controller.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message must be 2000 characters or less")
    private String message;
}
