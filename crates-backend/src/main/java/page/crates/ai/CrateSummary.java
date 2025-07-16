package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Consolidated response for crate operations with album matching results
 * Token-efficient summary optimized for AI consumption
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrateSummary {
    private String crateId;
    private String crateName;
    private String description;
    private String handle;
    private boolean isPublic;
    private int totalAlbums;
    private int albumsAdded;
    private int albumsFailed;
    private List<AlbumMatchResult> matchResults;
    private String userMessage; // friendly summary for user
    private String publicUrl; // public sharing link (decorated automatically)
}