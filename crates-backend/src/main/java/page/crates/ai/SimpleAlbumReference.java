package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple album reference for AI to specify albums with just title and artist
 * Used in consolidated MCP endpoints to reduce token usage
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleAlbumReference {
    private String title;
    private String artist;
}