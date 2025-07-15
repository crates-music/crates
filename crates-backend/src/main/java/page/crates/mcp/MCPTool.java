package page.crates.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * MCP tool definition for manifest
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPTool {
    private String name;
    private String description;
    private String method; // HTTP method (GET, POST, etc.)
    private String path;   // API endpoint path
    private Map<String, MCPParameter> parameters;
}