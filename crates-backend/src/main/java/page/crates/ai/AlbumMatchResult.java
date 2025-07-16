package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of attempting to match and add an album to a crate
 * Provides feedback to AI about success/failure of album matching
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumMatchResult {
    private String requestedTitle;
    private String requestedArtist;
    private boolean matched;
    private String actualTitle;
    private String actualArtist;
    private String message; // success message or reason for failure
}