package page.crates.controller.api;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @Size(max = 64, message = "Handle must be 64 characters or less")
    private String handle;
    
    @Size(max = 280, message = "Bio must be 280 characters or less")
    private String bio;
    
    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email must be 255 characters or less")
    private String email;
    
    private Boolean emailOptIn;
    
    private Boolean privateProfile;
}