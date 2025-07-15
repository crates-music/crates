package page.crates.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * MCP (Model Context Protocol) manifest structure for ChatGPT Custom GPT and Claude Desktop integration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCPManifest {
    private String name;
    private String version;
    private String description;
    private List<MCPServer> servers;
    private List<MCPTool> tools;
    private MCPOAuth oauth;
    private String baseUrl;
    private String transport;  // "http" or "sse"
}