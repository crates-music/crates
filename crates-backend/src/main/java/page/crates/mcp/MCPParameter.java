package page.crates.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MCP tool parameter definition
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPParameter {
    private String type;        // "string", "integer", "boolean"
    private String description;
    private boolean required;
    private Object defaultValue;
}