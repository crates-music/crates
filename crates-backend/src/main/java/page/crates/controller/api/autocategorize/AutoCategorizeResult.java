package page.crates.controller.api.autocategorize;

import lombok.Builder;
import lombok.Data;
import page.crates.ai.CrateSummary;

import java.util.List;

/**
 * Result of auto-categorization execution
 */
@Data
@Builder
public class AutoCategorizeResult {
    /**
     * Number of crates created
     */
    private int cratesCreated;

    /**
     * Number of albums categorized
     */
    private int albumsCategorized;

    /**
     * Coverage percentage
     */
    private double coveragePercent;

    /**
     * List of created crates with full details
     */
    private List<CrateSummary> crates;

    /**
     * Processing time in milliseconds
     */
    private long processingTimeMs;

    /**
     * Success message
     */
    private String message;

    /**
     * Whether genre enrichment was successful
     */
    private boolean genreEnrichmentSuccessful;
}
