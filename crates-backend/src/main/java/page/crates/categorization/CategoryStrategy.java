package page.crates.categorization;

import page.crates.entity.Album;

import java.util.List;

/**
 * Strategy for categorizing albums into crate proposals
 */
public interface CategoryStrategy {

    /**
     * Analyze albums and generate crate proposals
     *
     * @param albums User's library albums
     * @return List of crate proposals
     */
    List<CrateProposal> analyze(List<Album> albums);

    /**
     * Get the strategy name for logging/debugging
     *
     * @return Strategy name
     */
    default String getStrategyName() {
        return this.getClass().getSimpleName();
    }
}
