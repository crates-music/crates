package page.crates.controller.api.autocategorize;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Preview of what crates will be created (dry run)
 */
@Data
@Builder
public class AutoCategorizePreview {
    /**
     * Number of crates that will be created
     */
    private int proposedCrates;

    /**
     * Number of albums that will be categorized
     */
    private int albumsWillBeCategorized;

    /**
     * Total albums in user's library
     */
    private int totalLibraryAlbums;

    /**
     * Coverage percentage
     */
    private double coveragePercent;

    /**
     * List of proposed crates with preview info
     */
    private List<CrateProposalDTO> proposals;

    /**
     * Recommendation message
     */
    private String recommendation;
}
