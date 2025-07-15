package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a Spotify album search result for MCP tools
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyAlbumResult {
    private String spotifyId;
    private String name;
    private String artist;
    private String year;
    private String imageUrl;
    private boolean isInUserLibrary;
}