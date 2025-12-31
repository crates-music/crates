package page.crates.categorization;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates all categorization strategies and selects optimal crates
 */
@Slf4j
@Component
public class LibraryAnalyzer {

    @Resource
    private DecadeStrategy decadeStrategy;

    @Resource
    private GenreStrategy genreStrategy;

    @Resource
    private TopArtistStrategy topArtistStrategy;

    @Resource
    private SmartMixStrategy smartMixStrategy;

    @Resource
    private CrateSelector crateSelector;

    /**
     * Analyze library and generate optimal crate proposals
     *
     * @param libraryAlbums User's library albums (enriched with genres)
     * @return Optimal selection of 8-12 crate proposals
     */
    public List<CrateProposal> analyze(List<Album> libraryAlbums) {
        log.info("Analyzing library with {} albums", libraryAlbums.size());

        if (libraryAlbums.isEmpty()) {
            log.warn("Library is empty, cannot categorize");
            return new ArrayList<>();
        }

        if (libraryAlbums.size() < 20) {
            log.warn("Library has only {} albums (minimum 20 required)", libraryAlbums.size());
            throw new IllegalArgumentException(
                    String.format("Need at least 20 albums to auto-categorize. You have %d albums.",
                            libraryAlbums.size()));
        }

        // Run all strategies in parallel
        List<CrateProposal> allProposals = new ArrayList<>();

        // Decade strategy (always runs - most reliable)
        List<CrateProposal> decadeProposals = runStrategy(decadeStrategy, libraryAlbums);
        allProposals.addAll(decadeProposals);

        // Genre strategy
        List<CrateProposal> genreProposals = runStrategy(genreStrategy, libraryAlbums);
        allProposals.addAll(genreProposals);

        // Top artist strategy
        List<CrateProposal> artistProposals = runStrategy(topArtistStrategy, libraryAlbums);
        allProposals.addAll(artistProposals);

        // Smart mix strategy (decade + genre combinations)
        List<CrateProposal> mixProposals = runStrategy(smartMixStrategy, libraryAlbums);
        allProposals.addAll(mixProposals);

        log.info("Generated {} total proposals from all strategies", allProposals.size());

        // Check if we have any proposals
        if (allProposals.isEmpty()) {
            log.error("No proposals generated from any strategy");
            throw new RuntimeException("Unable to categorize library - no valid crate proposals generated");
        }

        // Select optimal 8-12 crates
        List<CrateProposal> selectedCrates = crateSelector.selectOptimal(allProposals, libraryAlbums.size());

        log.info("Selected {} optimal crates", selectedCrates.size());

        // Log summary
        logAnalysisSummary(selectedCrates, libraryAlbums.size());

        return selectedCrates;
    }

    /**
     * Run a single strategy with error handling
     */
    private List<CrateProposal> runStrategy(CategoryStrategy strategy, List<Album> albums) {
        try {
            log.debug("Running {}", strategy.getStrategyName());
            List<CrateProposal> proposals = strategy.analyze(albums);
            log.debug("{} generated {} proposals", strategy.getStrategyName(), proposals.size());
            return proposals;
        } catch (Exception e) {
            log.error("Strategy {} failed", strategy.getStrategyName(), e);
            return new ArrayList<>(); // Continue with other strategies
        }
    }

    /**
     * Log analysis summary
     */
    private void logAnalysisSummary(List<CrateProposal> selectedCrates, int totalAlbums) {
        long totalAlbumsCategorized = selectedCrates.stream()
                .flatMap(c -> c.getAlbums().stream())
                .distinct()
                .count();

        double coveragePercent = (double) totalAlbumsCategorized / totalAlbums * 100;

        log.info("=== Auto-Categorization Summary ===");
        log.info("Total library albums: {}", totalAlbums);
        log.info("Crates created: {}", selectedCrates.size());
        log.info("Albums categorized: {} ({:.1f}% coverage)", totalAlbumsCategorized, coveragePercent);

        // Log breakdown by strategy
        selectedCrates.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        CrateProposal::getStrategy,
                        java.util.stream.Collectors.counting()))
                .forEach((strategy, count) ->
                        log.info("  {} crates from {} strategy", count, strategy));
    }
}
