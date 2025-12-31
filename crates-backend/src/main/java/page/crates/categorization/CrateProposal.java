package page.crates.categorization;

import lombok.Builder;
import lombok.Data;
import page.crates.entity.Album;

import java.util.List;

/**
 * A proposed crate with name, albums, and metadata for selection algorithm
 */
@Data
@Builder
public class CrateProposal {
    /**
     * Proposed crate name (e.g., "1990s Hip Hop", "Best of Radiohead")
     */
    private String name;

    /**
     * Albums to include in this crate
     */
    private List<Album> albums;

    /**
     * Strategy that generated this proposal
     */
    private CategorizationStrategy strategy;

    /**
     * Priority score for selection (higher = more likely to be selected)
     */
    private double priority;

    /**
     * Optional description for the crate
     */
    private String description;

    /**
     * Whether this crate should be public by default
     */
    @Builder.Default
    private boolean publicCrate = true;

    public enum CategorizationStrategy {
        DECADE,
        GENRE,
        TOP_ARTIST,
        SMART_MIX
    }
}
