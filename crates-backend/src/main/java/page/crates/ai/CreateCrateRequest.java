package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to create a new crate via MCP/REST API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCrateRequest {
    private String name;
    private String description;
    private boolean isPublic;
}