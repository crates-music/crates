package page.crates.controller.api.autocategorize;

import lombok.Builder;
import lombok.Data;
import page.crates.ai.SimpleAlbumReference;

import java.util.List;

/**
 * Preview DTO for a proposed crate
 */
@Data
@Builder
public class CrateProposalDTO {
    /**
     * Proposed crate name
     */
    private String name;

    /**
     * Number of albums in this crate
     */
    private int albumCount;

    /**
     * Description of the crate
     */
    private String description;

    /**
     * Strategy that generated this proposal
     */
    private String strategy;

    /**
     * Albums in this proposal with artwork URLs
     */
    private List<SimpleAlbumReference> albums;
}
