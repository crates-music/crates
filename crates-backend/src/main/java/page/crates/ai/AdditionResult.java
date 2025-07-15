package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdditionResult {
    private boolean success;
    private String albumName;
    private String artist;
    private String message; // success or error message
}