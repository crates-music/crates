package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrateResult {
    private String crateId;
    private String crateName;
    private String description;
    private String handle; // crate handle for URL
    private boolean isPublic;
}