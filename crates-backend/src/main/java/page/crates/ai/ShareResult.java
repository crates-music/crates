package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareResult {
    private String publicUrl;
    private String crateName;
    private int albumCount;
    private String userMessage; // friendly message to return to user
}