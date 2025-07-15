package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @deprecated This class is no longer needed with the action-based MCP approach.
 * Use getUserLibrary() MCP tool directly which returns List<SimpleLibraryAlbum>.
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryAnalysis {
    private String userId;
    private int totalRecentAlbums;
    private List<SimpleLibraryAlbum> recentAlbums;
}